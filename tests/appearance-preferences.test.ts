import { describe, expect, it } from "vitest";
import {
  appearanceStorageKey,
  DEFAULT_APPEARANCE_PREFERENCES,
  initializeUserAppearance,
  readAppearancePreferences,
  writeAppearancePreferences,
} from "../lib/appearance-preferences";

function memoryStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => { records.set(key, value); },
  };
}

describe("account appearance preferences", () => {
  it("starts every new account in dark graphite mode", () => {
    const storage = memoryStorage();
    initializeUserAppearance(storage, "new-user");

    expect(readAppearancePreferences(storage, "new-user")).toEqual({
      theme: "dark",
      palette: "graphite",
      density: "comfortable",
    });
  });

  it("keeps preferences isolated between accounts on the same browser", () => {
    const storage = memoryStorage();
    writeAppearancePreferences(storage, "existing-user", {
      theme: "light",
      palette: "forest",
      density: "compact",
    });
    initializeUserAppearance(storage, "new-user");

    expect(readAppearancePreferences(storage, "existing-user").palette).toBe("forest");
    expect(readAppearancePreferences(storage, "new-user")).toEqual(DEFAULT_APPEARANCE_PREFERENCES);
    expect(appearanceStorageKey("existing-user")).not.toBe(appearanceStorageKey("new-user"));
  });

  it("preserves an existing user's selected preference", () => {
    const storage = memoryStorage();
    writeAppearancePreferences(storage, "user-one", {
      theme: "system",
      palette: "navy",
      density: "compact",
    });
    initializeUserAppearance(storage, "user-one");

    expect(readAppearancePreferences(storage, "user-one")).toEqual({
      theme: "system",
      palette: "navy",
      density: "compact",
    });
  });
});
