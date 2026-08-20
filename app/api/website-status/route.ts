import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const requestSchema = z.object({
  businessId: z.uuid(),
  url: z.string().url().refine((value) => /^https?:\/\//i.test(value), "Only HTTP(S) URLs are supported"),
});

export const runtime = "nodejs";

export function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase().replace(/^::ffff:/, "");
  if (isIP(normalized) === 4) {
    const [a, b, c] = normalized.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 0 || b === 168))
      || (a === 198 && (b === 18 || b === 19 || b === 51))
      || (a === 203 && b === 0 && c === 113);
  }
  return normalized === "::" || normalized === "::1"
    || normalized.startsWith("fc") || normalized.startsWith("fd")
    || /^fe[89ab]/.test(normalized);
}

async function ownsBusiness(request: NextRequest, businessId: string) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer ([A-Za-z0-9._~-]+)$/)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return false;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return false;
  const { data, error } = await supabase.from("businesses").select("id").eq("id", businessId).maybeSingle();
  return !error && Boolean(data);
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid website URL is required" }, { status: 400 });
  if (!await ownsBusiness(request, parsed.data.businessId)) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  const target = new URL(parsed.data.url);
  if (target.username || target.password || target.port || target.hostname === "localhost" || target.hostname.endsWith(".local")) {
    return NextResponse.json({ error: "This website address cannot be checked" }, { status: 400 });
  }
  try {
    const addresses = await lookup(target.hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
      return NextResponse.json({ error: "Private network URLs cannot be checked" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "The website address could not be resolved" }, { status: 400 });
  }
  const started = Date.now();
  try {
    const response = await fetch(target, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
      headers: { "user-agent": "Nexarch-Website-Checker/1.0" },
      cache: "no-store",
    });
    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({ status: "degraded", responseTimeMs: Date.now() - started, checkedAt: new Date().toISOString() });
    }
    const responseTimeMs = Date.now() - started;
    const status = response.status >= 500 ? "offline" : response.status >= 400 || responseTimeMs > 2_500 ? "degraded" : "online";
    return NextResponse.json({ status, httpStatusCode: response.status, responseTimeMs, checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "offline", responseTimeMs: Date.now() - started, checkedAt: new Date().toISOString() });
  }
}
