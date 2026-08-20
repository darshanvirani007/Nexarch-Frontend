import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { handleAuthCallback, type CodeExchange } from "../lib/auth-callback";

const credentials = { supabaseUrl: "https://project.supabase.co", supabaseKey: "public-anon-key" };

describe("email verification callback", () => {
  it("exchanges the code, ends the temporary session, and redirects to login", async () => {
    const exchangeCode = vi.fn(async ({ response }: Parameters<CodeExchange>[0]) => {
      response.cookies.set("sb-session", "session-cookie", { httpOnly: true });
      return { error: null };
    });
    const request = new NextRequest("https://www.nexarchapp.com/auth/callback?code=verification-code&next=/login");

    const response = await handleAuthCallback(request, { ...credentials, exchangeCode });

    expect(exchangeCode).toHaveBeenCalledOnce();
    expect(exchangeCode.mock.calls[0][0].code).toBe("verification-code");
    expect(exchangeCode.mock.calls[0][0].endSession).toBe(true);
    expect(response.cookies.get("sb-session")?.value).toBe("session-cookie");
    const destination = new URL(response.headers.get("location")!);
    expect(destination.pathname).toBe("/login");
    expect(destination.searchParams.get("verified")).toBe("1");
  });

  it("uses a safe generic error destination when the code is missing", async () => {
    const request = new NextRequest("https://www.nexarchapp.com/auth/callback?next=/login");
    const response = await handleAuthCallback(request, credentials);

    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
    expect(new URL(response.headers.get("location")!).searchParams.get("error")).toBe("verification_failed");
  });

  it("uses the same safe error page when code exchange fails", async () => {
    const exchangeCode = vi.fn().mockResolvedValue({ error: { message: "expired token secret" } });
    const request = new NextRequest("https://www.nexarchapp.com/auth/callback?code=expired&next=/login");
    const response = await handleAuthCallback(request, { ...credentials, exchangeCode });
    const location = response.headers.get("location")!;

    expect(location).toContain("/login?error=verification_failed");
    expect(location).not.toContain("expired");
    expect(location).not.toContain("token");
  });

  it("uses the safe error page when Supabase configuration is missing", async () => {
    const request = new NextRequest("https://www.nexarchapp.com/auth/callback?code=verification-code&next=/login");
    const response = await handleAuthCallback(request, { supabaseUrl: null, supabaseKey: null });
    const destination = new URL(response.headers.get("location")!);

    expect(destination.pathname).toBe("/login");
    expect(destination.searchParams.get("error")).toBe("verification_failed");
    expect(response.headers.get("location")).not.toContain("verification-code");
  });

  it("rejects an unsafe next value without leaking it", async () => {
    const exchangeCode = vi.fn().mockResolvedValue({ error: null });
    const request = new NextRequest("https://www.nexarchapp.com/auth/callback?code=safe-code&next=https://attacker.example");
    const response = await handleAuthCallback(request, { ...credentials, exchangeCode });
    const destination = new URL(response.headers.get("location")!);

    expect(destination.origin).toBe("https://www.nexarchapp.com");
    expect(destination.pathname).toBe("/login");
    expect(destination.searchParams.get("verified")).toBe("1");
    expect(response.headers.get("location")).not.toContain("attacker.example");
  });

  it("does not log or render raw exchange errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const exchangeCode = vi.fn().mockRejectedValue(new Error("refresh-token-sensitive-value"));
    const request = new NextRequest("https://www.nexarchapp.com/auth/callback?code=secret-code&next=/login");
    const response = await handleAuthCallback(request, { ...credentials, exchangeCode });

    expect(consoleError).not.toHaveBeenCalled();
    expect(response.headers.get("location")).not.toContain("refresh-token-sensitive-value");
    expect(response.headers.get("location")).not.toContain("secret-code");
    consoleError.mockRestore();
  });

  it("keeps OAuth sessions and redirects them to the dashboard", async () => {
    const exchangeCode = vi.fn().mockResolvedValue({ error: null });
    const request = new NextRequest("https://www.nexarchapp.com/auth/callback?code=oauth-code&next=/dashboard");

    const response = await handleAuthCallback(request, { ...credentials, exchangeCode });

    expect(exchangeCode.mock.calls[0][0].endSession).toBe(false);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/dashboard");
  });
});
