import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { accountProfileFromUser, mergeAccountProfile } from "../lib/account-profile";

function user(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-08-13T00:00:00Z",
    ...overrides,
  };
}

describe("account profile hydration", () => {
  it("shows Supabase identity metadata before the Laravel profile returns", () => {
    expect(accountProfileFromUser(user({
      email: "darshan@example.com",
      user_metadata: {
        full_name: "Darshan Virani",
        country: "Ireland",
        contact_number: "+353 87 123 4567",
      },
    }))).toEqual({
      fullName: "Darshan Virani",
      email: "darshan@example.com",
      country: "Ireland",
      contactNumber: "+353 87 123 4567",
      timezone: "Europe/Dublin",
    });
  });

  it("merges saved Laravel fields over the immediate identity fallback", () => {
    const identity = user({
      email: "auth@example.com",
      user_metadata: { full_name: "Auth Name", country: "Ireland" },
    });
    expect(mergeAccountProfile(identity, {
      email: "profile@example.com",
      profile: {
        id: "user-1",
        full_name: "Saved Name",
        country: "United Kingdom",
        contact_no: "+44 7700 900000",
        timezone: "Europe/London",
      },
    })).toEqual({
      fullName: "Saved Name",
      email: "profile@example.com",
      country: "United Kingdom",
      contactNumber: "+44 7700 900000",
      timezone: "Europe/London",
    });
  });

  it("preserves another supported saved timezone", () => {
    expect(accountProfileFromUser(user({ user_metadata: { timezone: "Asia/Kolkata" } })).timezone).toBe("Asia/Kolkata");
  });
});
