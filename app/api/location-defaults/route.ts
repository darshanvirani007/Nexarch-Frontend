import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const countryCode = request.headers.get("x-vercel-ip-country")
    || request.headers.get("cf-ipcountry")
    || request.headers.get("x-country-code");

  return NextResponse.json(
    { countryCode: countryCode?.toUpperCase() || null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
