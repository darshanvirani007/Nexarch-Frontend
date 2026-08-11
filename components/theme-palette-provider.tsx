"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  resolveThemePalette,
  THEME_PALETTE_STORAGE_KEY,
  type ThemePalette,
} from "@/lib/theme-palettes";

type ThemePaletteContextValue = {
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => void;
};

const ThemePaletteContext = createContext<ThemePaletteContextValue | null>(null);

function applyPalette(palette: ThemePalette) {
  document.documentElement.dataset.palette = palette;
}

export function ThemePaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<ThemePalette>("graphite");

  useEffect(() => {
    const initialPalette = resolveThemePalette(document.documentElement.dataset.palette);
    applyPalette(initialPalette);
    // The server cannot read this device preference; synchronise it after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaletteState(initialPalette);
  }, []);

  const setPalette = useCallback((nextPalette: ThemePalette) => {
    applyPalette(nextPalette);
    setPaletteState(nextPalette);
    try {
      window.localStorage.setItem(THEME_PALETTE_STORAGE_KEY, nextPalette);
    } catch {
      // The palette still applies for this session when storage is unavailable.
    }
  }, []);

  return (
    <ThemePaletteContext.Provider value={{ palette, setPalette }}>
      {children}
    </ThemePaletteContext.Provider>
  );
}

export function useThemePalette() {
  const context = useContext(ThemePaletteContext);
  if (!context) throw new Error("useThemePalette must be used inside ThemePaletteProvider");
  return context;
}
