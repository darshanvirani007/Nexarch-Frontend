import type { User } from "@supabase/supabase-js";
import type { ProfileResponse } from "@/lib/api/mappers";

export type AccountProfile = {
  fullName: string;
  email: string;
  country: string;
  contactNumber: string;
  timezone: "Europe/Dublin" | "Europe/London";
};

export const emptyAccountProfile: AccountProfile = {
  fullName: "",
  email: "",
  country: "",
  contactNumber: "",
  timezone: "Europe/Dublin",
};

function metadataText(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function accountProfileFromUser(user: User | null): AccountProfile {
  if (!user) return { ...emptyAccountProfile };
  const metadata = user.user_metadata ?? {};
  return {
    fullName: metadataText(metadata, "full_name", "name", "display_name"),
    email: user.email ?? "",
    country: metadataText(metadata, "country"),
    contactNumber: metadataText(metadata, "contact_number", "contact_no", "phone"),
    timezone: metadataText(metadata, "timezone") === "Europe/London" ? "Europe/London" : "Europe/Dublin",
  };
}

export function mergeAccountProfile(user: User, response: ProfileResponse): AccountProfile {
  const identity = accountProfileFromUser(user);
  const profile = response.profile;
  return {
    email: response.email || identity.email,
    fullName: profile?.full_name || identity.fullName,
    country: profile?.country || identity.country,
    contactNumber: profile?.contact_no || identity.contactNumber,
    timezone: profile?.timezone === "Europe/London" ? "Europe/London" : "Europe/Dublin",
  };
}
