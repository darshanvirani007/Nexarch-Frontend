import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  businessId: z.string().min(1),
  url: z.string().url().refine((value) => /^https?:\/\//i.test(value), "Only HTTP(S) URLs are supported"),
});

const PRIVATE_HOSTS = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[?::1\]?)/i;

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid website URL is required" }, { status: 400 });
  const target = new URL(parsed.data.url);
  if (PRIVATE_HOSTS.test(target.hostname)) return NextResponse.json({ error: "Private network URLs cannot be checked" }, { status: 400 });
  const started = Date.now();
  try {
    const response = await fetch(target, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
      headers: { "user-agent": "Nexarch-Website-Checker/1.0" },
      cache: "no-store",
    });
    const responseTimeMs = Date.now() - started;
    const status = response.status >= 500 ? "offline" : response.status >= 400 || responseTimeMs > 2_500 ? "degraded" : "online";
    return NextResponse.json({ status, httpStatusCode: response.status, responseTimeMs, checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "offline", responseTimeMs: Date.now() - started, checkedAt: new Date().toISOString() });
  }
}
