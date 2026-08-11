import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BrowserFavicon } from "@/components/browser-favicon";
import { Providers } from "@/components/providers";
import { themePaletteInitScript } from "@/lib/theme-palettes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Nexarch — Your Private Workspace",
    template: "%s · Nexarch",
  },
  description:
    "Nexarch brings your businesses, accounts, links, learning, goals and tasks together in one clear private workspace.",
  icons: {
    icon: [{ url: "/nexarch-mark.svg", type: "image/svg+xml" }],
    shortcut: "/nexarch-mark.svg",
  },
  openGraph: {
    title: "Nexarch — Your Private Workspace",
    description: "Nexarch brings your businesses, accounts, links, learning, goals and tasks together in one clear private workspace.",
    images: [{ url: "/og-v2.png", width: 1731, height: 909, alt: "Nexarch — Your Private Workspace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexarch — Your Private Workspace",
    description: "Nexarch brings your businesses, accounts, links, learning, goals and tasks together in one clear private workspace.",
    images: ["/og-v2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themePaletteInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers><BrowserFavicon />{children}</Providers>
      </body>
    </html>
  );
}
