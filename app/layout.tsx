import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BrowserFavicon } from "@/components/browser-favicon";
import { Providers } from "@/components/providers";

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
    default: "Nexarch — Your Personal Operating System",
    template: "%s · Nexarch",
  },
  description:
    "Nexarch brings your businesses, stores, accounts, learning, goals and important updates into one clear personal operating system.",
  icons: {
    icon: [{ url: "/nexarch-mark.svg", type: "image/svg+xml" }],
    shortcut: "/nexarch-mark.svg",
  },
  openGraph: {
    title: "Nexarch — Your Personal Operating System",
    description: "Nexarch brings your businesses, stores, accounts, learning, goals and important updates into one clear personal operating system.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Nexarch — Your Personal Operating System" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexarch — Your Personal Operating System",
    description: "Nexarch brings your businesses, stores, accounts, learning, goals and important updates into one clear personal operating system.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers><BrowserFavicon />{children}</Providers>
      </body>
    </html>
  );
}
