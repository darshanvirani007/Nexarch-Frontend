import { z } from "zod";
import type { ProfileResponse } from "@/lib/api/mappers";
import { createClient } from "./client";

const profileSchema = z.object({
  full_name: z.string().trim().max(160).nullable(),
  country: z.string().trim().max(100).nullable(),
  contact_no: z.string().trim().max(40).nullable(),
  timezone: z.enum(["Europe/Dublin", "Europe/London"]),
});

async function currentUser() {
  const { data, error } = await createClient().auth.getSession();
  if (error || !data.session?.user) throw new Error("Your session has expired. Please sign in again.");
  return data.session.user;
}

function profileError(error: { message: string; code?: string } | null, fallback: string) {
  if (error?.code === "42501") return new Error("You do not have permission to change this profile.");
  return new Error(error?.message || fallback);
}

export const profileService = {
  async get(): Promise<ProfileResponse> {
    const user = await currentUser();
    const { data, error } = await createClient()
      .from("profiles")
      .select("id, full_name, country, contact_no, timezone")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw profileError(error, "Your profile could not be loaded.");
    return { profile: data, email: user.email ?? null } as ProfileResponse;
  },

  async update(payload: unknown) {
    const user = await currentUser();
    const values = profileSchema.parse(payload);
    const { data, error } = await createClient()
      .from("profiles")
      .upsert({ id: user.id, ...values }, { onConflict: "id" })
      .select("id, full_name, country, contact_no, timezone")
      .single();
    if (error || !data) throw profileError(error, "Your profile could not be saved.");
    return data;
  },
};
