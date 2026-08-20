"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Check } from "lucide-react";
import { ThemePaletteProvider } from "@/components/theme-palette-provider";
import { AuthSessionProvider } from "@/components/auth-session-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem enableColorScheme={false} disableTransitionOnChange={false} storageKey="nexarch-theme-runtime-v2">
      <AuthSessionProvider>
        <ThemePaletteProvider>
          {children}
          <Toaster
            position="bottom-right"
            duration={3200}
            icons={{ success: <Check className="size-4" /> }}
            toastOptions={{ className: "nexarch-toast" }}
          />
        </ThemePaletteProvider>
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
