import { z } from "zod";
import type { MyLinkRow } from "@/lib/api/mappers";
import { createClient } from "./client";

const myLinkPayloadSchema = z.object({
  link_type: z.string().trim().min(1).max(50).transform((value) => value.toLowerCase()),
  category: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(120),
  url: z.url().max(2048).refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
    message: "URL must begin with http:// or https://",
  }),
  display_order: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

function databaseError(error: { message: string; code?: string } | null, fallback: string) {
  if (!error) return new Error(fallback);
  if (error.code === "42501") return new Error("You do not have permission to change this link.");
  return new Error(error.message || fallback);
}

async function currentUserId() {
  const { data, error } = await createClient().auth.getSession();
  if (error || !data.session?.user.id) throw new Error("Your session has expired. Please sign in again.");
  return data.session.user.id;
}

export const myLinksService = {
  async list(): Promise<MyLinkRow[]> {
    const { data, error } = await createClient()
      .from("my_links")
      .select("id, link_type, category, name, url, display_order, is_active, created_at")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw databaseError(error, "Your links could not be loaded.");
    return (data ?? []) as MyLinkRow[];
  },

  async create(payload: unknown): Promise<MyLinkRow> {
    const values = myLinkPayloadSchema.parse(payload);
    const userId = await currentUserId();
    const { data, error } = await createClient()
      .from("my_links")
      .insert({ ...values, user_id: userId })
      .select("id, link_type, category, name, url, display_order, is_active, created_at")
      .single();
    if (error || !data) throw databaseError(error, "The link could not be created.");
    return data as MyLinkRow;
  },

  async update(id: string, payload: unknown): Promise<MyLinkRow> {
    const values = myLinkPayloadSchema.partial().parse(payload);
    const { data, error } = await createClient()
      .from("my_links")
      .update(values)
      .eq("id", id)
      .select("id, link_type, category, name, url, display_order, is_active, created_at")
      .single();
    if (error || !data) throw databaseError(error, "The link could not be updated.");
    return data as MyLinkRow;
  },

  async remove(id: string): Promise<void> {
    const { error } = await createClient().from("my_links").delete().eq("id", id);
    if (error) throw databaseError(error, "The link could not be deleted.");
  },
};
