export function PublicFooter({ inverse = false }: { inverse?: boolean }) {
  return (
    <footer className={`text-center text-[11px] tracking-wide ${inverse ? "text-current opacity-45" : "muted"}`}>
      © 2026 Nexarch. All rights reserved.
    </footer>
  );
}
