import {
  resolveDensity,
  resolveThemePalette,
  type Density,
  type ThemePalette,
} from "@/lib/theme-palettes";

export type AppearanceTheme = "dark" | "light" | "system";

export type AppearancePreferences = {
  theme: AppearanceTheme;
  palette: ThemePalette;
  density: Density;
};

type AppearanceStorage = Pick<Storage, "getItem" | "setItem">;

export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  theme: "dark",
  palette: "graphite",
  density: "comfortable",
};

export function isAppearanceTheme(value: unknown): value is AppearanceTheme {
  return value === "dark" || value === "light" || value === "system";
}

export function appearanceStorageKey(userId: string) {
  return `nexarch-appearance:${userId}`;
}

export function resolveAppearancePreferences(value: unknown): AppearancePreferences {
  if (!value || typeof value !== "object") return { ...DEFAULT_APPEARANCE_PREFERENCES };
  const preferences = value as Partial<AppearancePreferences>;
  return {
    theme: isAppearanceTheme(preferences.theme) ? preferences.theme : "dark",
    palette: resolveThemePalette(preferences.palette),
    density: resolveDensity(preferences.density),
  };
}

export function readAppearancePreferences(storage: AppearanceStorage, userId: string) {
  try {
    const stored = storage.getItem(appearanceStorageKey(userId));
    return stored ? resolveAppearancePreferences(JSON.parse(stored)) : { ...DEFAULT_APPEARANCE_PREFERENCES };
  } catch {
    return { ...DEFAULT_APPEARANCE_PREFERENCES };
  }
}

export function writeAppearancePreferences(
  storage: AppearanceStorage,
  userId: string,
  preferences: AppearancePreferences,
) {
  storage.setItem(appearanceStorageKey(userId), JSON.stringify(resolveAppearancePreferences(preferences)));
}

export function initializeUserAppearance(storage: AppearanceStorage, userId: string) {
  const key = appearanceStorageKey(userId);
  if (storage.getItem(key) === null) {
    writeAppearancePreferences(storage, userId, DEFAULT_APPEARANCE_PREFERENCES);
  }
}
