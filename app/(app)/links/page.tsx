"use client";

import { useMemo, useState } from "react";
import {
  BriefcaseBusiness, Check, ExternalLink, Globe2, Link2, Mail, Pencil, Plus,
  Rss, Search, Sigma, Trash2,
} from "lucide-react";
import {
  SiBlogger, SiFiverr, SiGithub, SiLeetcode, SiLinkedin, SiMedium, SiOpenai,
  SiReddit, SiSupabase, SiUdemy, SiUpwork, SiVercel, SiYoutube,
} from "react-icons/si";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/components/app-store";
import { MotionList } from "@/components/motion";
import { Button, Field, inputClass, Modal, SelectControl } from "@/components/ui";
import { personalLinkSchema } from "@/lib/validations";
import {
  personalLinkKinds,
  type PersonalLink,
  type PersonalLinkCategory,
  type PersonalLinkKind,
} from "@/lib/types";

const categories = ["All", "Work", "Email", "Blog", "YouTube", "Development", "Social", "Others"] as const;
type CategoryFilter = typeof categories[number];
type FormErrors = Partial<Record<"name" | "kind" | "url", string>>;

function categoryForKind(kind: PersonalLinkKind): PersonalLinkCategory {
  if (["Freelance account", "Upwork", "Fiverr"].includes(kind)) return "Work";
  if (kind === "Email inbox") return "Email";
  if (kind === "Blog") return "Blog";
  if (kind === "YouTube") return "YouTube";
  if (["GitHub", "Supabase", "Vercel", "LeetCode", "GPT / ChatGPT", "Project Euler"].includes(kind)) return "Development";
  if (["LinkedIn", "Reddit"].includes(kind)) return "Social";
  return "Others";
}

function PersonalLinkIcon({ kind, url, className = "size-5" }: { kind: PersonalLinkKind; url?: string; className?: string }) {
  let hostname = "";
  try {
    hostname = url ? new URL(url).hostname.toLowerCase().replace(/^www\./, "") : "";
  } catch {
    // An invalid URL is handled by form validation; keep the type-based icon.
  }

  if (hostname === "youtu.be" || hostname === "youtube.com" || hostname.endsWith(".youtube.com")) return <SiYoutube className={className} />;
  if (hostname === "blogger.com" || hostname.endsWith(".blogger.com") || hostname.endsWith(".blogspot.com")) return <SiBlogger className={className} />;
  if (hostname === "medium.com" || hostname.endsWith(".medium.com")) return <SiMedium className={className} />;

  switch (kind) {
    case "Freelance account": return <BriefcaseBusiness className={className} />;
    case "Upwork": return <SiUpwork className={className} />;
    case "Fiverr": return <SiFiverr className={className} />;
    case "Email inbox": return <Mail className={className} />;
    case "Blog": return <Rss className={className} />;
    case "YouTube": return <SiYoutube className={className} />;
    case "GitHub": return <SiGithub className={className} />;
    case "Supabase": return <SiSupabase className={className} />;
    case "Vercel": return <SiVercel className={className} />;
    case "LinkedIn": return <SiLinkedin className={className} />;
    case "Reddit": return <SiReddit className={className} />;
    case "LeetCode": return <SiLeetcode className={className} />;
    case "GPT / ChatGPT": return <SiOpenai className={className} />;
    case "Udemy": return <SiUdemy className={className} />;
    case "Project Euler": return <Sigma className={className} />;
    case "Everyday website": return <Globe2 className={className} />;
    default: return <Link2 className={className} />;
  }
}

function displayUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function PersonalLinksPage() {
  const { personalLinks, setPersonalLinks } = useAppStore();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<PersonalLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<PersonalLink | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PersonalLinkKind>("Freelance account");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const visibleLinks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return personalLinks.filter((link) => {
      const categoryMatches = activeCategory === "All" || link.category === activeCategory;
      const queryMatches = !normalizedQuery || `${link.name} ${link.kind} ${link.category} ${link.url}`.toLowerCase().includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
  }, [activeCategory, personalLinks, query]);

  const resetForm = () => {
    setEditingLink(null);
    setName("");
    setKind("Freelance account");
    setUrl("");
    setErrors({});
  };

  const openAddForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (link: PersonalLink) => {
    setEditingLink(link);
    setName(link.name);
    setKind(link.kind);
    setUrl(link.url);
    setErrors({});
    setFormOpen(true);
  };

  const saveLink = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = personalLinkSchema.safeParse({ name, kind, url });
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      setErrors({ name: fields.name?.[0], kind: fields.kind?.[0], url: fields.url?.[0] });
      return;
    }

    const values = {
      name: result.data.name,
      kind: result.data.kind,
      category: categoryForKind(result.data.kind),
      url: result.data.url,
    };

    if (editingLink) {
      setPersonalLinks((links) => links.map((link) => link.id === editingLink.id ? { ...link, ...values } : link));
      toast.success("Link updated");
    } else {
      setPersonalLinks((links) => [{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...values }, ...links]);
      toast.success("Link added to My Links");
    }
    setFormOpen(false);
    resetForm();
  };

  return (
    <>
      <PageHeader
        eyebrow="Personal space"
        title="My Links"
        description="Keep your personal accounts, channels, profiles and everyday websites together."
        action={<Button onClick={openAddForm}><Plus className="size-4" /> Add link</Button>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="muted absolute left-3.5 top-3.5 size-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={`${inputClass} pl-10`}
            placeholder="Search links, platforms, or websites…"
            aria-label="Search personal links"
          />
        </div>
        <div className="muted flex h-11 items-center rounded-xl border px-3 text-xs">
          {personalLinks.length} {personalLinks.length === 1 ? "saved link" : "saved links"}
        </div>
      </div>

      <div className="scrollbar-none mb-8 flex gap-1 overflow-x-auto rounded-2xl border bg-foreground/[.025] p-1.5" role="tablist" aria-label="Link categories">
        {categories.map((category) => {
          const active = activeCategory === category;
          const count = category === "All" ? personalLinks.length : personalLinks.filter((link) => link.category === category).length;
          return (
            <button
              key={category}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(category)}
              className={`flex min-w-fit items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${active ? "bg-foreground text-background shadow-sm" : "muted hover:bg-foreground/5 hover:text-foreground"}`}
            >
              {category}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-background/15" : "bg-foreground/5"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {visibleLinks.length ? (
        <MotionList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleLinks.map((link) => (
            <article key={link.id} className="panel interactive-card group flex min-h-52 flex-col rounded-[22px] p-5">
              <div className="flex items-start gap-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border bg-foreground/[.035]">
                  <PersonalLinkIcon kind={link.kind} url={link.url} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold">{link.name}</h2>
                  <p className="muted mt-1 text-xs">{link.kind}</p>
                </div>
                <button onClick={() => openEditForm(link)} aria-label={`Edit ${link.name}`} className="muted rounded-xl p-2 transition hover:bg-foreground/5 hover:text-foreground">
                  <Pencil className="size-4" />
                </button>
                <button onClick={() => setDeletingLink(link)} aria-label={`Delete ${link.name}`} className="muted rounded-xl p-2 transition hover:bg-red-500/10 hover:text-red-500">
                  <Trash2 className="size-4" />
                </button>
              </div>

              <a href={link.url} target="_blank" rel="noopener noreferrer" className="muted mt-5 truncate text-xs transition hover:text-foreground">
                {displayUrl(link.url)}
              </a>

              <div className="mt-auto pt-6">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex h-10 w-full items-center justify-between rounded-xl border px-3 text-sm font-medium transition hover:border-foreground/20 hover:bg-foreground/5">
                  Open link
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </article>
          ))}
        </MotionList>
      ) : (
        <div className="panel flex min-h-64 items-center justify-center rounded-[22px] p-8 text-center">
          <div className="max-w-sm">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl border bg-foreground/[.035]"><Link2 className="size-5" /></span>
            <h2 className="mt-4 text-sm font-semibold">{personalLinks.length ? "No links found" : "Add your first personal link"}</h2>
            <p className="muted mt-2 text-xs leading-relaxed">
              {personalLinks.length ? "Try another search or category." : "Keep your freelance accounts, inboxes, profiles, learning platforms and daily websites in one place."}
            </p>
            {!personalLinks.length && <Button onClick={openAddForm} className="mt-5"><Plus className="size-4" /> Add link</Button>}
          </div>
        </div>
      )}

      <Modal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
        title={editingLink ? "Edit link" : "Add a personal link"}
        description={editingLink ? "Update its name or destination. The link type stays the same." : "Choose a platform once, then give the shortcut a name and destination."}
      >
        <form className="grid gap-4" onSubmit={saveLink}>
          {editingLink ? (
            <div className="rounded-2xl border bg-foreground/[.025] p-4">
              <p className="muted text-[10px] font-semibold uppercase tracking-[.16em]">Link type</p>
              <div className="mt-2 flex items-center gap-2.5 text-sm font-medium"><PersonalLinkIcon kind={kind} url={url} className="size-4" /> {kind}</div>
            </div>
          ) : (
            <Field label="Link type" error={errors.kind}>
              <SelectControl value={kind} onValueChange={(value) => { setKind(value as PersonalLinkKind); setErrors((current) => ({ ...current, kind: undefined })); }} options={personalLinkKinds} />
            </Field>
          )}
          <Field label="Name" error={errors.name}>
            <input value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })); }} className={inputClass} placeholder="My GitHub" autoFocus required />
          </Field>
          <Field label="URL" error={errors.url}>
            <input type="url" value={url} onChange={(event) => { setUrl(event.target.value); setErrors((current) => ({ ...current, url: undefined })); }} className={inputClass} placeholder="https://…" required />
          </Field>
          <Button type="submit">
            {editingLink ? <Check className="size-4" /> : <Plus className="size-4" />}
            {editingLink ? "Save changes" : "Add link"}
          </Button>
        </form>
      </Modal>

      <Modal open={Boolean(deletingLink)} onOpenChange={(open) => !open && setDeletingLink(null)} title="Delete this link?" description={deletingLink?.name || ""}>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeletingLink(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            if (!deletingLink) return;
            setPersonalLinks((links) => links.filter((link) => link.id !== deletingLink.id));
            toast.success("Link deleted");
            setDeletingLink(null);
          }}><Trash2 className="size-4" /> Delete link</Button>
        </div>
      </Modal>
    </>
  );
}
