import { describe, expect, it } from "vitest";
import { isThemePalette, resolveThemePalette, themePalettes } from "../lib/theme-palettes";

describe("theme palettes", () => {
  it("offers restrained business palettes with graphite as the default", () => {
    expect(themePalettes.map(({ value }) => value)).toEqual([
      "graphite",
      "slate",
      "navy",
      "forest",
      "burgundy",
      "espresso",
    ]);
    expect(resolveThemePalette(undefined)).toBe("graphite");
  });

  it("accepts supported palettes and rejects unknown stored values", () => {
    expect(isThemePalette("navy")).toBe(true);
    expect(resolveThemePalette("forest")).toBe("forest");
    expect(isThemePalette("neon")).toBe(false);
    expect(resolveThemePalette("neon")).toBe("graphite");
  });
});
