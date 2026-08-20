import { z } from "zod";
import type { BusinessLinkRow, BusinessRow, SocialRow } from "@/lib/api/mappers";
import { createClient } from "./client";

const httpUrl = z.url().max(2048).refine(
  (value) => value.startsWith("http://") || value.startsWith("https://"),
  "URL must begin with http:// or https://",
);
const businessSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable(),
  is_archived: z.boolean().optional(),
  display_order: z.number().int().nonnegative().optional(),
});
const linkSchema = z.object({
  link_type: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(120),
  url: httpUrl,
  show_on_card: z.boolean().optional(),
  display_order: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});
const socialSchema = z.object({
  platform: z.string().trim().min(1).max(50),
  username: z.string().trim().max(120).nullable(),
  url: httpUrl,
  show_on_card: z.boolean().optional(),
  display_order: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

const businessSelect = `
  id, name, description, is_archived, display_order,
  links:business_links(id, business_id, link_type, name, url, show_on_card, display_order, is_active),
  social_links:business_social_links(id, business_id, platform, username, url, show_on_card, display_order, is_active),
  note:business_notes(id, content),
  website_checks(id, business_id, status, http_status_code, response_time_ms, error_message, checked_at)
`;

async function currentUserId() {
  const { data, error } = await createClient().auth.getSession();
  if (error || !data.session?.user.id) throw new Error("Your session has expired. Please sign in again.");
  return data.session.user.id;
}

function databaseError(error: { message: string; code?: string } | null, fallback: string) {
  if (error?.code === "42501") return new Error("You do not have permission to change this business.");
  return new Error(error?.message || fallback);
}

export const businessesService = {
  async list(): Promise<BusinessRow[]> {
    const { data, error } = await createClient()
      .from("businesses")
      .select(businessSelect)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true })
      .order("display_order", { referencedTable: "business_links", ascending: true })
      .order("display_order", { referencedTable: "business_social_links", ascending: true })
      .order("checked_at", { referencedTable: "website_checks", ascending: false })
      .limit(10, { referencedTable: "website_checks" });
    if (error) throw databaseError(error, "Businesses could not be loaded.");
    return (data ?? []) as unknown as BusinessRow[];
  },

  async get(id: string): Promise<BusinessRow> {
    const { data, error } = await createClient().from("businesses").select(businessSelect).eq("id", id).single();
    if (error || !data) throw databaseError(error, "The business could not be loaded.");
    return data as unknown as BusinessRow;
  },

  async create(payload: unknown): Promise<BusinessRow> {
    const values = businessSchema.parse(payload);
    const userId = await currentUserId();
    const { data, error } = await createClient()
      .from("businesses")
      .insert({ ...values, user_id: userId })
      .select("id, name, description, is_archived, display_order")
      .single();
    if (error || !data) throw databaseError(error, "The business could not be created.");
    return data as BusinessRow;
  },

  async update(id: string, payload: unknown): Promise<BusinessRow> {
    const values = businessSchema.partial().parse(payload);
    const { data, error } = await createClient()
      .from("businesses").update(values).eq("id", id)
      .select("id, name, description, is_archived, display_order").single();
    if (error || !data) throw databaseError(error, "The business could not be updated.");
    return data as BusinessRow;
  },

  async remove(id: string): Promise<void> {
    const businessId = z.uuid().parse(id);
    const { error } = await createClient().rpc("delete_business", { target_business_id: businessId });
    if (error) throw databaseError(error, "The business could not be deleted.");
  },

  async createBusinessLink(businessId: string, payload: unknown): Promise<BusinessLinkRow> {
    const values = linkSchema.parse(payload);
    const userId = await currentUserId();
    const { data, error } = await createClient().from("business_links")
      .insert({ ...values, business_id: businessId, user_id: userId }).select("*").single();
    if (error || !data) throw databaseError(error, "The business link could not be created.");
    return data as BusinessLinkRow;
  },

  async updateBusinessLink(businessId: string, id: string, payload: unknown): Promise<BusinessLinkRow> {
    const values = linkSchema.partial().parse(payload);
    const { data, error } = await createClient().from("business_links")
      .update(values).eq("id", id).eq("business_id", businessId).select("*").single();
    if (error || !data) throw databaseError(error, "The business link could not be updated.");
    return data as BusinessLinkRow;
  },

  async removeBusinessLink(businessId: string, id: string): Promise<void> {
    const { error } = await createClient().from("business_links").delete().eq("id", id).eq("business_id", businessId);
    if (error) throw databaseError(error, "The business link could not be deleted.");
  },

  async createSocial(businessId: string, payload: unknown): Promise<SocialRow> {
    const values = socialSchema.parse(payload);
    const userId = await currentUserId();
    const { data, error } = await createClient().from("business_social_links")
      .insert({ ...values, business_id: businessId, user_id: userId }).select("*").single();
    if (error || !data) throw databaseError(error, "The social link could not be created.");
    return data as SocialRow;
  },

  async updateSocial(businessId: string, id: string, payload: unknown): Promise<SocialRow> {
    const values = socialSchema.partial().parse(payload);
    const { data, error } = await createClient().from("business_social_links")
      .update(values).eq("id", id).eq("business_id", businessId).select("*").single();
    if (error || !data) throw databaseError(error, "The social link could not be updated.");
    return data as SocialRow;
  },

  async removeSocial(businessId: string, id: string): Promise<void> {
    const { error } = await createClient().from("business_social_links").delete().eq("id", id).eq("business_id", businessId);
    if (error) throw databaseError(error, "The social link could not be deleted.");
  },

  async saveBusinessNote(businessId: string, content: string) {
    const userId = await currentUserId();
    const value = z.string().max(50_000).parse(content);
    const { data, error } = await createClient().from("business_notes")
      .upsert({ business_id: businessId, user_id: userId, content: value }, { onConflict: "business_id" })
      .select("id, content").single();
    if (error || !data) throw databaseError(error, "The business note could not be saved.");
    return data;
  },
};
