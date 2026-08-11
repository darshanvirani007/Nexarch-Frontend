import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AuthConfirmationView,
  EMAIL_CONFIRMATION_DELAY_MS,
  startEmailConfirmationRedirect,
} from "../components/auth-confirmation";

describe("email verification confirmation", () => {
  it("shows the verified state and a working manual continuation link", () => {
    const markup = renderToStaticMarkup(createElement(AuthConfirmationView, {
      status: "success",
      nextPath: "/onboarding",
    }));

    expect(markup).toContain("Email verified");
    expect(markup).toContain("Your email has been verified successfully.");
    expect(markup).toContain("Redirecting you to Nexarch");
    expect(markup).toContain('href="/onboarding"');
    expect(markup).toContain("Continue to Nexarch");
  });

  it("automatically continues to onboarding after the expected delay", () => {
    const navigate = vi.fn();
    let scheduled: (() => void) | undefined;
    const schedule = vi.fn((callback: () => void) => {
      scheduled = callback;
      return {} as ReturnType<typeof setTimeout>;
    });
    const cancel = vi.fn();

    const cleanup = startEmailConfirmationRedirect("success", "/onboarding", navigate, schedule, cancel);

    expect(schedule).toHaveBeenCalledWith(expect.any(Function), EMAIL_CONFIRMATION_DELAY_MS);
    scheduled?.();
    expect(navigate).toHaveBeenCalledWith("/onboarding");
    cleanup();
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("shows only generic guidance for verification failures", () => {
    const markup = renderToStaticMarkup(createElement(AuthConfirmationView, {
      status: "error",
      nextPath: "/onboarding",
    }));

    expect(markup).toContain("Verification could not be completed");
    expect(markup).toContain("This link may be invalid, expired, or already used.");
    expect(markup).toContain("Try signing in with your email and password.");
    expect(markup).toContain("Go to sign in");
    expect(markup).toContain("Create a new account");
    expect(markup).not.toContain("access_token");
    expect(markup).not.toContain("refresh_token");
  });
});
