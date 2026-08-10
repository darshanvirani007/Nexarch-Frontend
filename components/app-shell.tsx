"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  BookOpen, Building2, CheckSquare2, ChevronRight, Command,
  Goal, LayoutDashboard, Link2, Menu, Moon, Search, Settings, ShoppingBag,
  Sun, X,
} from "lucide-react";
import { format } from "date-fns";
import { AppStoreProvider, useAppStore } from "./app-store";
import { AuthGuard } from "./auth-guard";
import { BrandMark } from "./brand-mark";
import { NexarchLoader } from "./nexarch-loader";
import { Button, IconButton, Modal } from "./ui";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Links", href: "/links", icon: Link2 },
  { label: "Businesses", href: "/businesses", icon: Building2 },
  { label: "Commerce", href: "/commerce", icon: ShoppingBag },
  { label: "Learning", href: "/learning", icon: BookOpen },
  { label: "Goals", href: "/goals", icon: Goal },
  { label: "Tasks", href: "/tasks", icon: CheckSquare2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

function Sidebar({ mobile, close }: { mobile?: boolean; close?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className={mobile ? "flex h-full flex-col p-4" : "sidebar-shell fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r p-4 lg:flex"}>
      <Link href="/dashboard" className="mb-7 flex items-center gap-3 px-2 py-2" onClick={close}>
        <BrandMark />
        <span><span className="block text-sm font-semibold">Nexarch</span><span className="muted block text-[11px]">Your Personal Operating System</span></span>
      </Link>
      <nav className="flex-1 space-y-1" aria-label="Main navigation">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={close} className={`nav-item flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition duration-200 ${active ? "nav-item-active bg-foreground text-background shadow-md shadow-black/10" : "muted hover:translate-x-0.5 hover:bg-foreground/5 hover:text-foreground"}`}>
              <Icon className="size-[18px]" /><span>{label}</span>{active && <ChevronRight className="ml-auto size-3.5" />}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[.055] p-3.5 shadow-sm">
        <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold"><span className="grid size-6 place-items-center rounded-lg bg-foreground text-background"><Command className="size-3.5" /></span> Quick search</div>
        <p className="text-xs leading-relaxed text-foreground/70">Find anything quickly with <kbd className="ml-1 rounded-md border border-foreground/15 bg-background/70 px-1.5 py-0.5 font-medium text-foreground shadow-sm">⌘ K</kbd></p>
      </div>
    </aside>
  );
}

function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const router = useRouter();
  const { businesses, personalLinks } = useAppStore();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const all = [
      ...navigation.map((item) => ({ label: item.label, detail: "Go to page", href: item.href, external: false })),
      ...businesses.map((item) => ({ label: item.name, detail: "Open business", href: `/businesses/${item.id}`, external: false })),
      ...personalLinks.map((item) => ({ label: item.name, detail: `${item.kind} · My Links`, href: item.url, external: true })),
    ];
    return all.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [businesses, personalLinks, query]);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Command menu" description="Jump to a page, business, or personal link.">
      <div className="relative mb-3">
        <Search className="muted absolute left-3 top-3.5 size-4" />
        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search everything…" className="premium-input h-12 w-full rounded-xl border bg-transparent pl-10 pr-3 text-sm" />
      </div>
      <div className="space-y-1">
        {results.map((item) => (
          <button key={`${item.href}-${item.label}`} onClick={() => { if (item.external) window.open(item.href, "_blank", "noopener,noreferrer"); else router.push(item.href); onOpenChange(false); }} className="flex w-full items-center rounded-xl px-3 py-3 text-left hover:bg-foreground/5">
            <span><span className="block text-sm font-medium">{item.label}</span><span className="muted text-xs">{item.detail}</span></span>
            <ChevronRight className="muted ml-auto size-4" />
          </button>
        ))}
      </div>
    </Modal>
  );
}

function Header({ openMobile, openCommand }: { openMobile: () => void; openCommand: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Theme resolution is browser-only; defer the icon until after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  return (
    <header className="topbar sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <IconButton label="Open navigation" onClick={openMobile} className="lg:hidden"><Menu className="size-4" /></IconButton>
      <button onClick={openCommand} className="muted hidden h-10 w-full max-w-md items-center gap-2 rounded-xl border bg-[var(--panel)] px-3 text-left text-sm transition hover:border-foreground/20 sm:flex">
        <Search className="size-4" /><span>Search Nexarch</span><kbd className="ml-auto rounded border px-1.5 py-0.5 text-[10px]">⌘ K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <IconButton label="Toggle theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{mounted && resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</IconButton>
      </div>
    </header>
  );
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { dataLoading, dataError, reloadData } = useAppStore();
  const [mobile, setMobile] = useState(false);
  const [command, setCommand] = useState(false);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommand(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <div className="min-h-screen">
      <Sidebar />
      {mobile && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/60" aria-label="Close navigation" onClick={() => setMobile(false)} /><div className="glass absolute inset-y-0 left-0 w-72"><button className="absolute right-4 top-4 z-10" onClick={() => setMobile(false)} aria-label="Close navigation"><X className="size-5" /></button><Sidebar mobile close={() => setMobile(false)} /></div></div>}
      <div className="lg:pl-64"><Header openMobile={() => setMobile(true)} openCommand={() => setCommand(true)} /><main key={pathname} className="page-content mx-auto max-w-[1500px] p-4 pb-28 sm:p-7 lg:p-10">{dataLoading ? <NexarchLoader /> : dataError ? <AppDataError message={dataError} retry={reloadData} /> : children}</main></div>
      <CommandMenu open={command} onOpenChange={setCommand} />
      <nav className="glass fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl p-1.5 lg:hidden" aria-label="Mobile navigation">
        {navigation.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return <Link key={href} href={href} className={`mobile-nav-item grid min-w-14 place-items-center gap-1 rounded-xl p-2 text-[10px] transition ${active ? "mobile-nav-item-active text-foreground" : "muted"}`}><Icon className="size-[18px]" />{label}</Link>;
        })}
      </nav>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <AuthGuard><AppStoreProvider><ShellContent>{children}</ShellContent></AppStoreProvider></AuthGuard>;
}

function AppDataError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="panel mx-auto max-w-xl rounded-[22px] p-8 text-center"><h1 className="text-xl font-semibold">Your data could not be loaded</h1><p className="muted mt-2 text-sm">{message}</p><Button className="mt-6" onClick={retry}>Try again</Button></div>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>{eyebrow && <p className="muted mb-2.5 text-[11px] font-semibold uppercase tracking-[.2em]">{eyebrow}</p>}<h1 className="page-title text-3xl font-semibold tracking-[-.04em] sm:text-[2.65rem] sm:leading-[1.05]">{title}</h1><p className="muted mt-3 max-w-2xl text-sm leading-relaxed">{description}</p></div>
      {action}
    </div>
  );
}

export function DashboardGreeting() {
  return <PageHeader eyebrow={format(new Date(), "EEEE · MMMM d, yyyy")} title="Everything important, in one place." description="See what changed across your work, businesses, stores, learning and goals." />;
}
