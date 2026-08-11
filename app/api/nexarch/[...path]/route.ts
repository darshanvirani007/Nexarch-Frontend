import { NextResponse } from "next/server";
import { buildNexarchUpstreamUrl } from "@/lib/api/upstream";

type RouteContext = { params: Promise<{ path: string[] }> };

const UPSTREAM_TIMEOUT_MS = 55_000;

export const runtime = "nodejs";
export const maxDuration = 60;

async function forward(request: Request, context: RouteContext) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json({ message: "The Nexarch API is not configured." }, { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
  }

  try {
    const { path } = await context.params;
    const target = buildNexarchUpstreamUrl(apiUrl, path, new URL(request.url).search);
    const headers = new Headers({
      Accept: "application/json",
      Authorization: authorization,
    });
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);

    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", upstream.headers.get("content-type") ?? "application/json");
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) responseHeaders.set("Retry-After", retryAfter);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error && error.name !== "TimeoutError"
      ? error.message
      : "The Nexarch API did not respond in time.";
    return NextResponse.json({ message }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
