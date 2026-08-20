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

type PinnedResponse = { statusCode: number; location?: string };

function requestPinned(target: URL, address: string, family: 4 | 6, method: "HEAD" | "GET") {
  return new Promise<PinnedResponse>((resolve, reject) => {
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
      method,
      headers: {
        "user-agent": "Nexarch-Website-Checker/1.0",
        ...(method === "GET" ? { range: "bytes=0-0" } : {}),
      },
      lookup: pinnedLookup,
      servername: target.protocol === "https:" ? target.hostname : undefined,
    }, (response) => {
      const result = {
        statusCode: response.statusCode ?? 0,
        location: typeof response.headers.location === "string" ? response.headers.location : undefined,
      };
      response.destroy();
      resolve(result);
    });
    outgoing.setTimeout(8_000, () => outgoing.destroy(new Error("Website check timed out")));
    outgoing.on("error", reject);
    outgoing.end();
  });
}

function validateTarget(target: URL) {
  return (target.protocol === "http:" || target.protocol === "https:")
    && !target.username
    && !target.password
    && !target.port
    && target.hostname !== "localhost"
    && !target.hostname.endsWith(".local");
}

async function publicAddress(target: URL) {
  const addresses = await lookup(target.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private network target");
  }
  const preferred = addresses.find(({ family }) => family === 4) ?? addresses[0];
  return preferred as { address: string; family: 4 | 6 };
}

async function checkWithSafeRedirects(initialTarget: URL) {
  let target = initialTarget;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    if (!validateTarget(target)) throw new Error("Unsafe website target");
    const pinnedAddress = await publicAddress(target);
    let response = await requestPinned(target, pinnedAddress.address, pinnedAddress.family, "HEAD");
    if (response.statusCode === 405 || response.statusCode === 501) {
      response = await requestPinned(target, pinnedAddress.address, pinnedAddress.family, "GET");
    }
    if (response.statusCode < 300 || response.statusCode >= 400 || !response.location) {
      return response.statusCode;
    }
    if (redirectCount === 3) return response.statusCode;
    target = new URL(response.location, target);
  }
  return 0;
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
  if (!parsed.success) return NextResponse.json({ error: "A valid website URL is required (WC_INPUT)" }, { status: 400 });
  const auth = await authenticatedBusiness(request, parsed.data.businessId);
  if (!auth) {
    return NextResponse.json({ error: "Your session or business could not be verified (WC_AUTH)" }, { status: 404 });
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
    if (error) {
      console.error("website_check_insert_failed", { code: error.code });
      return NextResponse.json({ error: "The website was checked, but its result could not be saved (WC_SAVE)" }, { status: 500 });
    }
    return NextResponse.json({
      status: check.status,
      httpStatusCode: check.httpStatusCode,
      responseTimeMs: check.responseTimeMs,
      checkedAt,
    });
  };
  const target = new URL(parsed.data.url);
  if (!validateTarget(target)) {
    return NextResponse.json({ error: "This website address cannot be checked (WC_TARGET)" }, { status: 400 });
  }
  try {
    await publicAddress(target);
  } catch {
    return NextResponse.json({ error: "The website address could not be resolved safely (WC_DNS)" }, { status: 400 });
  }
  const started = Date.now();
  try {
    const httpStatusCode = await checkWithSafeRedirects(target);
    if (httpStatusCode >= 300 && httpStatusCode < 400) {
      return saveCheck({ status: "degraded", httpStatusCode, responseTimeMs: Date.now() - started });
    }
    const responseTimeMs = Date.now() - started;
    const status = httpStatusCode >= 500 ? "offline" : httpStatusCode >= 400 || responseTimeMs > 2_500 ? "degraded" : "online";
    return saveCheck({ status, httpStatusCode, responseTimeMs });
  } catch {
    return saveCheck({ status: "offline", responseTimeMs: Date.now() - started, errorMessage: "Website check request failed." });
  }
}
