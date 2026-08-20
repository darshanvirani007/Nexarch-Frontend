import Link from "next/link";

export function PublicFooter({ inverse = false }: { inverse?: boolean }) {
  return (
    <footer className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] tracking-wide ${inverse ? "text-current opacity-55" : "muted"}`}>
      <span>© 2026 Nexarch. All rights reserved.</span>
      <Link href="/privacy" className="underline decoration-current/30 underline-offset-4 hover:opacity-70">Privacy</Link>
    </footer>
  );
}
