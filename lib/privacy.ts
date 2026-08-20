import { createClient } from "@/lib/supabase/client";

const exportTables = [
  "profiles", "my_links", "businesses", "business_links", "business_social_links",
  "business_notes", "website_checks", "learning", "goals", "daily_tasks", "tasks", "job_applications",
] as const;

function localNexarchData() {
  if (typeof window === "undefined") return {};
  return Object.fromEntries(
    Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
      .filter((key): key is string => Boolean(key?.startsWith("nexarch")))
      .map((key) => [key, window.localStorage.getItem(key)]),
  );
}

export async function exportMyData() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Your session could not be verified.");

  const results = await Promise.all(exportTables.map(async (table) => {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw new Error(`Your ${table.replaceAll("_", " ")} data could not be exported.`);
    return [table, data ?? []] as const;
  }));
  const { data: developmentKeys, error: keyError } = await supabase.from("business_development_keys")
    .select("id, user_id, business_id, name, key_type, environment, description, is_active, created_at, updated_at");
  if (keyError) throw new Error("Development key metadata could not be exported.");

  return {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      authentication_providers: user.app_metadata?.providers ?? [],
      profile_metadata: user.user_metadata,
    },
    data: { ...Object.fromEntries(results), business_development_keys: developmentKeys ?? [] },
    local_device_data: localNexarchData(),
  };
}

export function downloadJsonExport(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nexarch-data-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function clearLocalNexarchData() {
  if (typeof window === "undefined") return;
  const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
    .filter((key): key is string => Boolean(key?.startsWith("nexarch")));
  keys.forEach((key) => window.localStorage.removeItem(key));
}

export async function deleteMyAccount() {
  const supabase = createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw new Error("Your account could not be deleted. Please contact the privacy team.");
  clearLocalNexarchData();
  await supabase.auth.signOut({ scope: "local" });
}
