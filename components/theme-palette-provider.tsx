"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  type Density,
  type ThemePalette,
} from "@/lib/theme-palettes";
import {
  DEFAULT_APPEARANCE_PREFERENCES,
  isAppearanceTheme,
  readAppearancePreferences,
  writeAppearancePreferences,
  type AppearancePreferences,
  type AppearanceTheme,
} from "@/lib/appearance-preferences";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type ThemePaletteContextValue = {
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => void;
  density: Density;
  setDensity: (density: Density) => void;
  theme: AppearanceTheme;
  resolvedTheme?: string;
  setTheme: (theme: AppearanceTheme) => void;
};

const ThemePaletteContext = createContext<ThemePaletteContextValue | null>(null);

function applyPalette(palette: ThemePalette) {
  document.documentElement.dataset.palette = palette;
}

function applyDensity(density: Density) {
  document.documentElement.dataset.density = density;
}

export function ThemePaletteProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme: setNextTheme } = useTheme();
  const userIdRef = useRef<string | null>(null);
  const [preferences, setPreferences] = useState<AppearancePreferences>(DEFAULT_APPEARANCE_PREFERENCES);

  const persist = useCallback((nextPreferences: AppearancePreferences) => {
    const userId = userIdRef.current;
    if (!userId) return;
    try {
      writeAppearancePreferences(window.localStorage, userId, nextPreferences);
    } catch {
      // Appearance still applies for this session when browser storage is unavailable.
    }
  }, []);

  const applyPreferences = useCallback((nextPreferences: AppearancePreferences, userId: string | null) => {
    userIdRef.current = userId;
    applyPalette(nextPreferences.palette);
    applyDensity(nextPreferences.density);
    setNextTheme(nextPreferences.theme);
    setPreferences(nextPreferences);
  }, [setNextTheme]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let active = true;
    const supabase = createClient();
    const applyForUser = (userId: string | null | undefined) => {
      if (!active) return;
      const nextPreferences = userId
        ? readAppearancePreferences(window.localStorage, userId)
        : DEFAULT_APPEARANCE_PREFERENCES;
      applyPreferences(nextPreferences, userId ?? null);
      if (userId) persist(nextPreferences);
    };

    void supabase.auth.getSession().then(({ data }) => applyForUser(data.session?.user.id));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyForUser(session?.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applyPreferences, persist]);

  const setPalette = useCallback((nextPalette: ThemePalette) => {
    applyPalette(nextPalette);
    setPreferences((current) => {
      const next = { ...current, palette: nextPalette };
      persist(next);
      return next;
    });
  }, [persist]);

  const setDensity = useCallback((nextDensity: Density) => {
    applyDensity(nextDensity);
    setPreferences((current) => {
      const next = { ...current, density: nextDensity };
      persist(next);
      return next;
    });
  }, [persist]);

  const setTheme = useCallback((nextTheme: AppearanceTheme) => {
    if (!isAppearanceTheme(nextTheme)) return;
    setNextTheme(nextTheme);
    setPreferences((current) => {
      const next = { ...current, theme: nextTheme };
      persist(next);
      return next;
    });
  }, [persist, setNextTheme]);

  return (
    <ThemePaletteContext.Provider value={{ ...preferences, resolvedTheme, setPalette, setDensity, setTheme }}>
      {children}
    </ThemePaletteContext.Provider>
  );
}

export function useThemePalette() {
  const context = useContext(ThemePaletteContext);
  if (!context) throw new Error("useThemePalette must be used inside ThemePaletteProvider");
  return context;
}
