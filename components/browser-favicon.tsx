"use client";

import { useEffect } from "react";

const nexarchFavicon = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="10" fill="#111110"/>
    <path d="M19 10V22a3 3 0 1 0 3-3H10a3 3 0 1 0 3 3V10a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" fill="none" stroke="#F3F3EF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="16" cy="26" r="1" fill="#F3F3EF" fill-opacity=".5"/>
  </svg>
`)}`;

export function BrowserFavicon() {
  useEffect(() => {
    document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((link) => link.remove());
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = nexarchFavicon;
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, []);

  return null;
}
