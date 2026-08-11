"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  DENSITY_STORAGE_KEY,
  resolveDensity,
  resolveThemePalette,
  THEME_PALETTE_STORAGE_KEY,
  type Density,
  type ThemePalette,
} from "@/lib/theme-palettes";

type ThemePaletteContextValue = {
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => void;
  density: Density;
  setDensity: (density: Density) => void;
};

const ThemePaletteContext = createContext<ThemePaletteContextValue | null>(null);

function applyPalette(palette: ThemePalette) {
  document.documentElement.dataset.palette = palette;
}

function applyDensity(density: Density) {
  document.documentElement.dataset.density = density;
}

export function ThemePaletteProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<{ palette: ThemePalette; density: Density }>({
    palette: "graphite",
    density: "comfortable",
  });

  useEffect(() => {
    const initialPalette = resolveThemePalette(document.documentElement.dataset.palette);
    const initialDensity = resolveDensity(document.documentElement.dataset.density);
    applyPalette(initialPalette);
    applyDensity(initialDensity);
    // The server cannot read this device preference; synchronise it after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences({ palette: initialPalette, density: initialDensity });
  }, []);

  const setPalette = useCallback((nextPalette: ThemePalette) => {
    applyPalette(nextPalette);
    setPreferences((current) => ({ ...current, palette: nextPalette }));
    try {
      window.localStorage.setItem(THEME_PALETTE_STORAGE_KEY, nextPalette);
    } catch {
      // The palette still applies for this session when storage is unavailable.
    }
  }, []);

  const setDensity = useCallback((nextDensity: Density) => {
    applyDensity(nextDensity);
    setPreferences((current) => ({ ...current, density: nextDensity }));
    try {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, nextDensity);
    } catch {
      // The density still applies for this session when storage is unavailable.
    }
  }, []);

  return (
    <ThemePaletteContext.Provider value={{ ...preferences, setPalette, setDensity }}>
      {children}
    </ThemePaletteContext.Provider>
  );
}

export function useThemePalette() {
  const context = useContext(ThemePaletteContext);
  if (!context) throw new Error("useThemePalette must be used inside ThemePaletteProvider");
  return context;
}
