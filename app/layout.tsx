import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BrowserFavicon } from "@/components/browser-favicon";
import { Providers } from "@/components/providers";
import { themePaletteInitScript } from "@/lib/theme-palettes";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.nexarchapp.com";
const title = "Nexarch — Your Private Workspace";
const description =
  "Keep your businesses, accounts, links, learning, goals and tasks together in one clear private workspace.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: "Nexarch",
  title: {
    default: title,
    template: "%s · Nexarch",
  },
  description,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/nexarch-mark.svg", type: "image/svg+xml" }],
    shortcut: "/nexarch-mark.svg",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Nexarch",
    title,
    description,
    images: [
      {
        url: "/nexarch-social-card.jpg",
        width: 1200,
        height: 630,
        alt: "Nexarch private workspace sign-in and product overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/nexarch-social-card.jpg"],
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
