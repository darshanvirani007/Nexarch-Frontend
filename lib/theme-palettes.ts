export const THEME_PALETTE_STORAGE_KEY = "nexarch-color-palette";
export const DENSITY_STORAGE_KEY = "nexarch-density";

export const themePalettes = [
  { value: "graphite", label: "Graphite" },
  { value: "slate", label: "Slate" },
  { value: "navy", label: "Executive Navy" },
  { value: "forest", label: "Forest" },
  { value: "burgundy", label: "Burgundy" },
  { value: "espresso", label: "Espresso" },
] as const;

export type ThemePalette = (typeof themePalettes)[number]["value"];

export const densityOptions = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
] as const;

export type Density = (typeof densityOptions)[number]["value"];

const themePaletteValues: readonly string[] = themePalettes.map(({ value }) => value);

export function isThemePalette(value: unknown): value is ThemePalette {
  return typeof value === "string" && themePaletteValues.includes(value);
}

export function resolveThemePalette(value: unknown): ThemePalette {
  return isThemePalette(value) ? value : "graphite";
}

export function isDensity(value: unknown): value is Density {
  return value === "comfortable" || value === "compact";
}

export function resolveDensity(value: unknown): Density {
  return isDensity(value) ? value : "comfortable";
}

export const themePaletteInitScript = `
(function () {
  var fallback = "graphite";
  try {
    var supported = ${JSON.stringify(themePaletteValues)};
    var stored = window.localStorage.getItem(${JSON.stringify(THEME_PALETTE_STORAGE_KEY)});
    document.documentElement.dataset.palette = supported.indexOf(stored) >= 0 ? stored : fallback;
    var density = window.localStorage.getItem(${JSON.stringify(DENSITY_STORAGE_KEY)});
    document.documentElement.dataset.density = density === "compact" ? "compact" : "comfortable";
  } catch (_) {
    document.documentElement.dataset.palette = fallback;
    document.documentElement.dataset.density = "comfortable";
  }
})();`;
