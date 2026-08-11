import { describe, expect, it } from "vitest";
import { buildAuthCallbackUrl, getAppUrl, safeInternalPath } from "../lib/auth-redirect";

describe("authentication redirect URLs", () => {
  it("uses the configured Vercel URL for production callbacks", () => {
    const callback = new URL(buildAuthCallbackUrl("/onboarding", {
      configuredUrl: "https://nexarch-frontend.vercel.app",
      browserOrigin: "https://preview.example",
      environment: "production",
    }));

    expect(callback.origin).toBe("https://nexarch-frontend.vercel.app");
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("next")).toBe("/onboarding");
  });

  it("never falls back to localhost in production", () => {
    expect(() => getAppUrl({ configuredUrl: null, browserOrigin: null, environment: "production" })).toThrow();
    expect(() => getAppUrl({ configuredUrl: "http://localhost:3000", environment: "production" })).toThrow();
  });

  it("allows localhost during local development", () => {
    expect(getAppUrl({ configuredUrl: null, browserOrigin: null, environment: "development" })).toBe("http://localhost:3000");
    expect(getAppUrl({ configuredUrl: "http://localhost:3000/", environment: "development" })).toBe("http://localhost:3000");
  });

  it("normalizes trailing slashes", () => {
    expect(getAppUrl({ configuredUrl: "https://nexarch-frontend.vercel.app/", environment: "production" })).toBe("https://nexarch-frontend.vercel.app");
  });

  it("rejects external and protocol-relative next destinations", () => {
    expect(safeInternalPath("https://attacker.example")).toBe("/onboarding");
    expect(safeInternalPath("//attacker.example")).toBe("/onboarding");
    expect(safeInternalPath("javascript:alert(1)")).toBe("/onboarding");
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
  });
});
