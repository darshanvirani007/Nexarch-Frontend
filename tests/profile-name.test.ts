import { describe, expect, it } from "vitest";
import { profileFirstName } from "../lib/profile-name";

describe("profile greeting name", () => {
  it("uses the first name from Supabase profile metadata", () => {
    expect(profileFirstName({ user_metadata: { full_name: "Darshan Virani" } })).toBe("Darshan");
    expect(profileFirstName({ user_metadata: { name: "  Alex   Morgan  " } })).toBe("Alex");
  });

  it("uses a readable email fallback without displaying the full address", () => {
    expect(profileFirstName({ email: "sam.taylor@example.com", user_metadata: {} })).toBe("Sam");
    expect(profileFirstName(null)).toBe("there");
  });
});
