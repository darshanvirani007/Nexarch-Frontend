"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";

const ambientPalettes = [
  { name: "Graphite", background: "#e5e5e1", foreground: "#111110" },
  { name: "Slate", background: "#dbe2e6", foreground: "#11161a" },
  { name: "Executive Navy", background: "#dae2ee", foreground: "#101724" },
  { name: "Forest", background: "#d9e5dc", foreground: "#111a15" },
  { name: "Burgundy", background: "#eadde1", foreground: "#201216" },
  { name: "Espresso", background: "#e6ddd3", foreground: "#1e1712" },
] as const;

const ROTATION_INTERVAL_MS = 10_000;

export function LoginShowcase() {
  const [paletteIndex, setPaletteIndex] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let interval: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (interval || reducedMotion.matches || document.hidden) return;
      interval = setInterval(() => {
        setPaletteIndex((current) => (current + 1) % ambientPalettes.length);
      }, ROTATION_INTERVAL_MS);
    };
    const stop = () => {
      if (interval) clearInterval(interval);
      interval = undefined;
    };
    const update = () => {
      stop();
      start();
    };

    start();
    document.addEventListener("visibilitychange", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  const palette = ambientPalettes[paletteIndex];
  return (
    <aside
      className="relative hidden overflow-hidden border-l lg:flex lg:flex-col lg:justify-between lg:p-14"
      style={{
        backgroundColor: palette.background,
        color: palette.foreground,
        transition: "background-color 1400ms cubic-bezier(.2,.8,.2,1), color 1400ms cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/25 blur-3xl" />
      <div className="relative flex items-center justify-between gap-6 text-sm font-medium">
        <span>Everything you’re building, one clear view.</span>
        <span className="rounded-full border border-current/15 px-2.5 py-1 text-[10px] uppercase tracking-[.14em] opacity-55">{palette.name}</span>
      </div>
      <div className="relative">
        <h2 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-.05em]">Your businesses.<br />Your accounts.<br />Your next moves.</h2>
        <ul className="mt-10 space-y-3 text-sm opacity-65">
          {["Keep every important link and workspace close", "Track learning, goals and daily priorities", "See what needs attention without platform hopping"].map((item) => (
            <li key={item} className="flex items-center gap-2"><Check className="size-4" />{item}</li>
          ))}
        </ul>
      </div>
      <div className="relative grid gap-2">
        <p className="text-xs opacity-50">Nexarch · Your Private Workspace</p>
        <PublicFooter inverse />
      </div>
    </aside>
  );
}
