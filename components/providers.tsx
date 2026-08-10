"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Check } from "lucide-react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <Toaster
        position="bottom-right"
        duration={3200}
        icons={{ success: <Check className="size-4" /> }}
        toastOptions={{ className: "nexarch-toast" }}
      />
    </ThemeProvider>
  );
}
