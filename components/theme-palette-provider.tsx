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
import { useAuthSession } from "@/components/auth-session-provider";
import { appearanceService } from "@/lib/supabase/appearance";

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
  const { user } = useAuthSession();
  const userIdRef = useRef<string | null>(null);
  const remoteQueueRef = useRef(Promise.resolve());
  const appearanceTransitionTimerRef = useRef<number | null>(null);
  const [preferences, setPreferences] = useState<AppearancePreferences>(DEFAULT_APPEARANCE_PREFERENCES);

  const transitionAppearance = useCallback((apply: () => void) => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply();
      return;
    }
    if (appearanceTransitionTimerRef.current !== null) {
      window.clearTimeout(appearanceTransitionTimerRef.current);
    }
    root.classList.add("appearance-transitioning");
    void root.offsetWidth;
    apply();
    appearanceTransitionTimerRef.current = window.setTimeout(() => {
      root.classList.remove("appearance-transitioning");
      appearanceTransitionTimerRef.current = null;
    }, 480);
  }, []);

  useEffect(() => () => {
    if (appearanceTransitionTimerRef.current !== null) {
      window.clearTimeout(appearanceTransitionTimerRef.current);
    }
    document.documentElement.classList.remove("appearance-transitioning");
  }, []);

  const persist = useCallback((nextPreferences: AppearancePreferences) => {
    const userId = userIdRef.current;
    if (!userId) return;
    try {
      writeAppearancePreferences(window.localStorage, userId, nextPreferences);
    } catch {
      // Appearance still applies for this session when browser storage is unavailable.
    }
    remoteQueueRef.current = remoteQueueRef.current
      .then(() => appearanceService.save(userId, nextPreferences))
      .catch(() => undefined);
  }, []);

  const applyPreferences = useCallback((nextPreferences: AppearancePreferences, userId: string | null) => {
    userIdRef.current = userId;
    applyPalette(nextPreferences.palette);
    applyDensity(nextPreferences.density);
    setNextTheme(nextPreferences.theme);
    setPreferences(nextPreferences);
  }, [setNextTheme]);

  useEffect(() => {
    const userId = user?.id;
    const cachedPreferences = userId
      ? readAppearancePreferences(window.localStorage, userId)
      : DEFAULT_APPEARANCE_PREFERENCES;
    queueMicrotask(() => {
      applyPreferences(cachedPreferences, userId ?? null);
    });
    if (userId) {
      void appearanceService.get(userId).then((remotePreferences) => {
        if (userIdRef.current !== userId) return;
        const nextPreferences = remotePreferences ?? cachedPreferences;
        applyPreferences(nextPreferences, userId);
        writeAppearancePreferences(window.localStorage, userId, nextPreferences);
        if (!remotePreferences) persist(nextPreferences);
      }).catch(() => undefined);
    }
  }, [applyPreferences, persist, user?.id]);

  const setPalette = useCallback((nextPalette: ThemePalette) => {
    transitionAppearance(() => applyPalette(nextPalette));
    setPreferences((current) => {
      const next = { ...current, palette: nextPalette };
      persist(next);
      return next;
    });
  }, [persist, transitionAppearance]);

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
    transitionAppearance(() => setNextTheme(nextTheme));
    setPreferences((current) => {
      const next = { ...current, theme: nextTheme };
      persist(next);
      return next;
    });
  }, [persist, setNextTheme, transitionAppearance]);

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
