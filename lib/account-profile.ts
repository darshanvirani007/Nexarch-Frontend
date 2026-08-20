import type { User } from "@supabase/supabase-js";
import type { ProfileResponse } from "@/lib/api/mappers";
import { isNexarchTimezone, type NexarchTimezone } from "@/lib/timezones";

export type AccountProfile = {
  fullName: string;
  email: string;
  country: string;
  contactNumber: string;
  timezone: NexarchTimezone;
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

function timezoneOrDefault(value: string, fallback: NexarchTimezone = "Europe/Dublin") {
  return isNexarchTimezone(value) ? value : fallback;
}

export function accountProfileFromUser(user: User | null): AccountProfile {
  if (!user) return { ...emptyAccountProfile };
  const metadata = user.user_metadata ?? {};
  return {
    fullName: metadataText(metadata, "full_name", "name", "display_name"),
    email: user.email ?? "",
    country: metadataText(metadata, "country"),
    contactNumber: metadataText(metadata, "contact_number", "contact_no", "phone"),
    timezone: timezoneOrDefault(metadataText(metadata, "timezone")),
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
    timezone: profile?.timezone && isNexarchTimezone(profile.timezone) ? profile.timezone : identity.timezone,
  };
}
