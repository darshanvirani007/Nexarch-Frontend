import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { isPrivateAddress } from "@/lib/network-security";

const requestSchema = z.object({
  businessId: z.uuid(),
  url: z.string().url().refine((value) => /^https?:\/\//i.test(value), "Only HTTP(S) URLs are supported"),
});

export const runtime = "nodejs";

function requestPinned(target: URL, address: string, family: 4 | 6) {
  return new Promise<number>((resolve, reject) => {
    const request = target.protocol === "https:" ? httpsRequest : httpRequest;
    const pinnedLookup = ((
      _hostname: string,
      _options: unknown,
      callback: (error: NodeJS.ErrnoException | null, resolvedAddress: string, resolvedFamily: 4 | 6) => void,
    ) => callback(null, address, family)) as LookupFunction;
    const outgoing = request({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.protocol === "https:" ? 443 : 80,
      path: `${target.pathname}${target.search}`,
      method: "HEAD",
      headers: { host: target.hostname, "user-agent": "Nexarch-Website-Checker/1.0" },
      lookup: pinnedLookup,
      servername: target.protocol === "https:" ? target.hostname : undefined,
    }, (response) => {
      response.resume();
      resolve(response.statusCode ?? 0);
    });
    outgoing.setTimeout(8_000, () => outgoing.destroy(new Error("Website check timed out")));
    outgoing.on("error", reject);
    outgoing.end();
  });
}

async function authenticatedBusiness(request: NextRequest, businessId: string) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer ([A-Za-z0-9._~-]+)$/)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return null;
  const { data, error } = await supabase.from("businesses").select("id").eq("id", businessId).maybeSingle();
  if (error || !data) return null;
  return { supabase, userId: userData.user.id };
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid website URL is required" }, { status: 400 });
  const auth = await authenticatedBusiness(request, parsed.data.businessId);
  if (!auth) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  const saveCheck = async (check: {
    status: "online" | "offline" | "degraded";
    httpStatusCode?: number;
    responseTimeMs: number;
    errorMessage?: string;
  }) => {
    const checkedAt = new Date().toISOString();
    const { error } = await auth.supabase.from("website_checks").insert({
      business_id: parsed.data.businessId,
      user_id: auth.userId,
      status: check.status,
      http_status_code: check.httpStatusCode ?? null,
      response_time_ms: check.responseTimeMs,
      error_message: check.errorMessage ?? null,
      checked_at: checkedAt,
    });
    if (error) return NextResponse.json({ error: "The website result could not be saved" }, { status: 500 });
    return NextResponse.json({
      status: check.status,
      httpStatusCode: check.httpStatusCode,
      responseTimeMs: check.responseTimeMs,
      checkedAt,
    });
  };
  const target = new URL(parsed.data.url);
  if (target.username || target.password || target.port || target.hostname === "localhost" || target.hostname.endsWith(".local")) {
    return NextResponse.json({ error: "This website address cannot be checked" }, { status: 400 });
  }
  let pinnedAddress: { address: string; family: 4 | 6 };
  try {
    const addresses = await lookup(target.hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
      return NextResponse.json({ error: "Private network URLs cannot be checked" }, { status: 400 });
    }
    pinnedAddress = addresses[0] as { address: string; family: 4 | 6 };
  } catch {
    return NextResponse.json({ error: "The website address could not be resolved" }, { status: 400 });
  }
  const started = Date.now();
  try {
    const httpStatusCode = await requestPinned(target, pinnedAddress.address, pinnedAddress.family);
    if (httpStatusCode >= 300 && httpStatusCode < 400) {
      return saveCheck({ status: "degraded", responseTimeMs: Date.now() - started });
    }
    const responseTimeMs = Date.now() - started;
    const status = httpStatusCode >= 500 ? "offline" : httpStatusCode >= 400 || responseTimeMs > 2_500 ? "degraded" : "online";
    return saveCheck({ status, httpStatusCode, responseTimeMs });
  } catch {
    return saveCheck({ status: "offline", responseTimeMs: Date.now() - started, errorMessage: "Website check request failed." });
  }
}
