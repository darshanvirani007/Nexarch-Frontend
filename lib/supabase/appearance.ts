import { resolveAppearancePreferences, type AppearancePreferences } from "@/lib/appearance-preferences";
import { createClient } from "./client";

type AppearanceRow = {
  appearance_theme: unknown;
  appearance_palette: unknown;
  appearance_density: unknown;
};

function values(preferences: AppearancePreferences) {
  return {
    appearance_theme: preferences.theme,
    appearance_palette: preferences.palette,
    appearance_density: preferences.density,
  };
}

export const appearanceService = {
  async get(userId: string): Promise<AppearancePreferences | null> {
    const { data, error } = await createClient().from("profiles")
      .select("appearance_theme, appearance_palette, appearance_density")
      .eq("id", userId).maybeSingle();
    if (error) throw new Error(error.message || "Appearance preferences could not be loaded.");
    const row = data as AppearanceRow | null;
    if (!row || row.appearance_theme === null || row.appearance_palette === null || row.appearance_density === null) return null;
    return resolveAppearancePreferences({
      theme: row.appearance_theme,
      palette: row.appearance_palette,
      density: row.appearance_density,
    });
  },

  async save(userId: string, preferences: AppearancePreferences): Promise<void> {
    const payload = values(resolveAppearancePreferences(preferences));
    const { data, error } = await createClient().from("profiles")
      .update(payload).eq("id", userId).select("id").maybeSingle();
    if (error) throw new Error(error.message || "Appearance preferences could not be saved.");
    if (data) return;

    const { error: insertError } = await createClient().from("profiles").insert({
      id: userId,
      timezone: "Europe/Dublin",
      ...payload,
    });
    if (insertError) throw new Error(insertError.message || "Appearance preferences could not be saved.");
  },
};
