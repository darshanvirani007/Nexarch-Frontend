export const THEME_PALETTE_STORAGE_KEY = "nexarch-color-palette";

export const themePalettes = [
  { value: "graphite", label: "Graphite" },
  { value: "slate", label: "Slate" },
  { value: "navy", label: "Executive Navy" },
  { value: "forest", label: "Forest" },
  { value: "burgundy", label: "Burgundy" },
  { value: "espresso", label: "Espresso" },
] as const;

export type ThemePalette = (typeof themePalettes)[number]["value"];

const themePaletteValues: readonly string[] = themePalettes.map(({ value }) => value);

export function isThemePalette(value: unknown): value is ThemePalette {
  return typeof value === "string" && themePaletteValues.includes(value);
}

export function resolveThemePalette(value: unknown): ThemePalette {
  return isThemePalette(value) ? value : "graphite";
}

export const themePaletteInitScript = `
(function () {
  var fallback = "graphite";
  try {
    var supported = ${JSON.stringify(themePaletteValues)};
    var stored = window.localStorage.getItem(${JSON.stringify(THEME_PALETTE_STORAGE_KEY)});
    document.documentElement.dataset.palette = supported.indexOf(stored) >= 0 ? stored : fallback;
  } catch (_) {
    document.documentElement.dataset.palette = fallback;
  }
})();`;
