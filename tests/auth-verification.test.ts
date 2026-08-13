import { describe, expect, it, vi } from "vitest";
import { resendSignupVerification } from "../lib/auth-verification";

describe("verification email resend", () => {
  it("uses the same secure signup callback destination", async () => {
    const resend = vi.fn().mockResolvedValue({ error: null });

    await resendSignupVerification({ resend }, "person@example.com", {
      configuredUrl: "https://www.nexarchapp.com/",
      environment: "production",
    });

    expect(resend).toHaveBeenCalledOnce();
    const request = resend.mock.calls[0][0];
    const callback = new URL(request.options.emailRedirectTo);
    expect(request.type).toBe("signup");
    expect(request.email).toBe("person@example.com");
    expect(callback.origin).toBe("https://www.nexarchapp.com");
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("next")).toBe("/onboarding");
  });
});
