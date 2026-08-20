import { z } from "zod";
import { createClient } from "./client";

const httpUrl = z.url().max(2048).refine(
  (value) => value.startsWith("http://") || value.startsWith("https://"),
  "URL must begin with http:// or https://",
);

const schemas = {
  learning: z.object({
    title: z.string().trim().min(1).max(200),
    category: z.string().trim().min(1).max(50),
    status: z.enum(["to_learn", "not_started", "in_progress", "completed"]),
    provider_or_author: z.string().trim().max(160).nullable(),
    resource_url: httpUrl.nullable(),
    display_order: z.number().int().nonnegative().optional(),
  }),
  goals: z.object({
    title: z.string().trim().min(1).max(200),
    category: z.string().trim().min(1).max(50),
    measure: z.string().trim().min(1).max(120),
    deadline: z.iso.date().nullable(),
    display_order: z.number().int().nonnegative().optional(),
    current_value: z.number().finite(),
    target_value: z.number().finite().positive(),
    unit: z.string().trim().min(1).max(40),
  }),
  "daily-tasks": z.object({
    task: z.string().trim().min(1).max(500),
    task_date: z.iso.date(),
    is_completed: z.boolean().optional(),
    display_order: z.number().int().nonnegative().optional(),
  }),
  tasks: z.object({
    task: z.string().trim().min(1).max(500),
    is_completed: z.boolean().optional(),
    display_order: z.number().int().nonnegative().optional(),
  }),
  "job-applications": z.object({
    job_name: z.string().trim().min(1).max(200),
    job_link: httpUrl.nullable(),
    status: z.enum(["pending", "applied", "accepted", "rejected"]),
    display_order: z.number().int().nonnegative().optional(),
  }),
} as const;

export type DirectResource = keyof typeof schemas;

const tables: Record<DirectResource, string> = {
  learning: "learning",
  goals: "goals",
  "daily-tasks": "daily_tasks",
  tasks: "tasks",
  "job-applications": "job_applications",
};

function friendlyError(error: { message: string; code?: string } | null, fallback: string) {
  if (error?.code === "42501") return new Error("You do not have permission to change this item.");
  return new Error(error?.message || fallback);
}

async function currentUserId() {
  const { data, error } = await createClient().auth.getSession();
  if (error || !data.session?.user.id) throw new Error("Your session has expired. Please sign in again.");
  return data.session.user.id;
}

export function isDirectResource(resource: string): resource is DirectResource {
  return Object.hasOwn(schemas, resource);
}

export const ownedCrudService = {
  async list<T>(resource: DirectResource): Promise<T[]> {
    const { data, error } = await createClient()
      .from(tables[resource])
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw friendlyError(error, "Your data could not be loaded.");
    return (data ?? []) as T[];
  },

  async create<T>(resource: DirectResource, payload: unknown): Promise<T> {
    const values = schemas[resource].parse(payload);
    const userId = await currentUserId();
    const { data, error } = await createClient()
      .from(tables[resource])
      .insert({ ...values, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw friendlyError(error, "The item could not be created.");
    return data as T;
  },

  async update<T>(resource: DirectResource, id: string, payload: unknown): Promise<T> {
    const values = schemas[resource].partial().parse(payload);
    const { data, error } = await createClient()
      .from(tables[resource])
      .update(values)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) throw friendlyError(error, "The item could not be updated.");
    return data as T;
  },

  async remove(resource: DirectResource, id: string): Promise<void> {
    const { error } = await createClient().from(tables[resource]).delete().eq("id", id);
    if (error) throw friendlyError(error, "The item could not be deleted.");
  },
};
