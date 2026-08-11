import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeInternalPath } from "@/lib/auth-redirect";

type CallbackResponse = NextResponse<unknown>;
export type CodeExchange = (input: {
  code: string;
  request: NextRequest;
  response: CallbackResponse;
  supabaseUrl: string;
  supabaseKey: string;
}) => Promise<{ error: unknown | null }>;

const exchangeSupabaseCode: CodeExchange = async ({ code, request, response, supabaseUrl, supabaseKey }) => {
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  return supabase.auth.exchangeCodeForSession(code);
};

function callbackFailure(request: NextRequest, nextPath: string) {
  const path = nextPath === "/onboarding"
    ? "/auth/confirmed?status=error"
    : "/login?error=oauth_callback_failed";
  return NextResponse.redirect(new URL(path, request.url));
}

function callbackSuccessPath(nextPath: string) {
  if (nextPath !== "/onboarding") return nextPath;
  return `/auth/confirmed?next=${encodeURIComponent(nextPath)}`;
}

export async function handleAuthCallback(request: NextRequest, options: {
  supabaseUrl?: string | null;
  supabaseKey?: string | null;
  exchangeCode?: CodeExchange;
} = {}) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const destination = safeInternalPath(requestUrl.searchParams.get("next"));
  const supabaseUrl = options.supabaseUrl === undefined ? process.env.NEXT_PUBLIC_SUPABASE_URL : options.supabaseUrl;
  const supabaseKey = options.supabaseKey === undefined ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : options.supabaseKey;

  if (!code || !supabaseUrl || !supabaseKey) {
    return callbackFailure(request, destination);
  }

  const response = NextResponse.redirect(new URL(callbackSuccessPath(destination), request.url));

  try {
    const { error } = await (options.exchangeCode ?? exchangeSupabaseCode)({
      code,
      request,
      response,
      supabaseUrl,
      supabaseKey,
    });
    if (error) return callbackFailure(request, destination);
    return response;
  } catch {
    return callbackFailure(request, destination);
  }
}
