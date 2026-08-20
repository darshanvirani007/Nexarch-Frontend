import { describe, expect, it } from "vitest";
import { buildAuthCallbackUrl, getAppUrl, safeInternalPath } from "../lib/auth-redirect";

describe("authentication redirect URLs", () => {
  it("uses the configured Vercel URL for production callbacks", () => {
    const callback = new URL(buildAuthCallbackUrl("/login", {
      configuredUrl: "https://www.nexarchapp.com",
      browserOrigin: "https://preview.example",
      environment: "production",
    }));

    expect(callback.origin).toBe("https://www.nexarchapp.com");
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("next")).toBe("/login");
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
    expect(getAppUrl({ configuredUrl: "https://www.nexarchapp.com/", environment: "production" })).toBe("https://www.nexarchapp.com");
  });

  it("rejects external and protocol-relative next destinations", () => {
    expect(safeInternalPath("https://attacker.example")).toBe("/login");
    expect(safeInternalPath("//attacker.example")).toBe("/login");
    expect(safeInternalPath("javascript:alert(1)")).toBe("/login");
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
  });
});
