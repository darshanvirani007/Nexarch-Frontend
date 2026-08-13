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
  document.documentElement.dataset.palette = "graphite";
  document.documentElement.dataset.density = "comfortable";
})();`;
