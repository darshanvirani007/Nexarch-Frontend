import { NextResponse } from "next/server";
import { buildNexarchUpstreamUrl } from "@/lib/api/upstream";

type RouteContext = { params: Promise<{ path: string[] }> };

const UPSTREAM_TIMEOUT_MS = 55_000;
const MAX_REQUEST_BYTES = 1_000_000;

export const runtime = "nodejs";
export const maxDuration = 60;

async function forward(request: Request, context: RouteContext) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json({ message: "The Nexarch API is not configured." }, { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer [A-Za-z0-9._~-]+$/.test(authorization)) {
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
    if (contentType && !contentType.toLowerCase().startsWith("application/json")) {
      return NextResponse.json({ message: "Only JSON request bodies are accepted." }, { status: 415 });
    }
    if (contentType) headers.set("Content-Type", "application/json");

    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ message: "The request body is too large." }, { status: 413 });
    }
    const body = hasBody ? await request.arrayBuffer() : undefined;
    if (body && body.byteLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ message: "The request body is too large." }, { status: 413 });
    }
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      return NextResponse.json({ message: "The Nexarch API returned an unsafe redirect." }, { status: 502 });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", upstream.headers.get("content-type") ?? "application/json");
    responseHeaders.set("Cache-Control", "private, no-store, max-age=0");
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) responseHeaders.set("Retry-After", retryAfter);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ message: "The Nexarch API request could not be completed." }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
