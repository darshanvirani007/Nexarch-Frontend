"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpRight, Building2, ChartNoAxesCombined, Check, Cloud, Code2, CreditCard,
  Database, ExternalLink, FileText, Globe, Globe2, Headphones, Link2, Mail,
  PanelsTopLeft, Plus, Route, Rss, Server, Settings2, Trash2,
} from "lucide-react";
import {
  SiFacebook, SiGithub, SiInstagram, SiLinkedin, SiReddit,
  SiThreads, SiTiktok, SiX, SiYoutube,
} from "react-icons/si";
import { toast } from "sonner";
import type { z } from "zod";
import { businessSchema, socialAccountSchema } from "@/lib/validations";
import type { Business, BusinessLink, WebsiteStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";
import { useAppStore } from "./app-store";
import { Badge, Button, Field, inputClass, Modal, SelectControl } from "./ui";

const statusConfig: Record<WebsiteStatus, { label: string; tone: "green" | "yellow" | "red" | "neutral"; dot: string }> = {
  online: { label: "Online", tone: "green", dot: "status-dot-active bg-emerald-500" },
  offline: { label: "Offline", tone: "red", dot: "bg-red-500" },
  degraded: { label: "Degraded", tone: "yellow", dot: "bg-amber-500" },
  unknown: { label: "Unknown", tone: "neutral", dot: "bg-zinc-400" },
  checking: { label: "Checking", tone: "neutral", dot: "animate-pulse bg-zinc-400" },
};

export function WebsiteStatusBadge({ status }: { status: WebsiteStatus }) {
  const item = statusConfig[status];
  return <Badge tone={item.tone}><span className={`size-1.5 rounded-full ${item.dot}`} />{item.label}</Badge>;
}

export const WebsiteLinkIcon = Globe;

const socialIcons: Record<Business["socials"][number]["platform"], React.ElementType> = {
  LinkedIn: SiLinkedin,
  Instagram: SiInstagram,
  X: SiX,
  YouTube: SiYoutube,
  Facebook: SiFacebook,
  TikTok: SiTiktok,
  GitHub: SiGithub,
  Threads: SiThreads,
  Reddit: SiReddit,
  Blog: Rss,
  Other: Globe2,
};

export function SocialPlatformIcon({ platform, className = "size-4" }: { platform: Business["socials"][number]["platform"]; className?: string }) {
  const Icon = socialIcons[platform];
  return <Icon className={className} aria-hidden="true" />;
}

export function CardVisibilitySwitch({
  checked,
  onCheckedChange,
  accessibleLabel = "Show on business card",
  className,
  promptClassName,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  accessibleLabel?: string;
  className?: string;
  promptClassName?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-3", className)} title="Show this shortcut on the business card">
      <span className={cn("muted text-xs", promptClassName)}>Show on card</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="peer sr-only"
        aria-label={accessibleLabel}
      />
      <span
        aria-hidden="true"
        className="relative h-5 w-9 shrink-0 rounded-full bg-foreground/12 transition after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-foreground peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-foreground peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
      />
      <span className="text-xs font-medium">{checked ? "Shown" : "Hidden"}</span>
    </label>
  );
}

export function iconForBusinessLink(link: BusinessLink) {
  const label = link.label.toLowerCase();
  if (label.includes("website") || link.category === "Website") return WebsiteLinkIcon;
  if (label.includes("github") || label.includes("repository")) return SiGithub;
  if (label.includes("business suite")) return PanelsTopLeft;
  if (label.includes("supabase") || label.includes("database")) return Database;
  if (label.includes("vercel") || label.includes("cloudflare")) return Cloud;
  if (label.includes("analytics") || label.includes("search console")) return ChartNoAxesCombined;
  if (label.includes("stripe") || label.includes("payment")) return CreditCard;
  if (label.includes("notion") || label.includes("document")) return FileText;
  if (label.includes("support")) return Headphones;
  if (label.includes("domain") || label.includes("registrar")) return Route;
  if (label.includes("email") || label.includes("inbox")) return Mail;
  if (label.includes("admin")) return Settings2;
  if (link.category === "Development") return Code2;
  if (link.category === "Hosting") return Cloud;
  if (link.category === "Analytics") return ChartNoAxesCombined;
  if (link.category === "Payments") return CreditCard;
  if (link.category === "Documents") return FileText;
  return Link2;
}

export function ExternalShortcut({ href, label, icon: Icon = ExternalLink, large }: { href: string; label: string; icon?: React.ElementType; large?: boolean }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-2 rounded-xl border bg-[var(--panel)] font-medium transition hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-foreground/5 ${large ? "h-14 px-5 text-sm" : "size-9"}`} aria-label={`Open ${label}`} title={label}>
      <Icon className="size-4" />{large && <span>{label}</span>}
    </a>
  );
}

export async function checkBusinessWebsite(business: Business, setStatus: ReturnType<typeof useAppStore>["setStatus"]) {
  if (!business.websiteUrl) return;
  setStatus(business.id, "checking");
  try {
    const { data: sessionData } = await createClient().auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error("Authentication required");
    const response = await fetch("/api/website-status", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ businessId: business.id, url: business.websiteUrl }),
    });
    const result = await response.json() as { status: WebsiteStatus; responseTimeMs?: number; httpStatusCode?: number; checkedAt?: string; error?: string };
    if (!response.ok) throw new Error(result.error || "Status check failed");
    setStatus(business.id, result.status, result.responseTimeMs, result.httpStatusCode, result.checkedAt);
    toast.success(`${business.name} is ${result.status}`);
  } catch {
    setStatus(business.id, "offline");
    toast.error(`Could not reach ${business.name}`);
  }
}

export function BusinessCard({ business }: { business: Business }) {
  const workspaceHref = `/businesses/${business.id}`;
  const showPrimaryShortcut = (shortcut: "website" | "email" | "admin" | "hosting" | "domain") =>
    business.cardShortcutVisibility?.[shortcut] !== false;
  const quickLinks = [
    { id: "website", href: showPrimaryShortcut("website") ? business.websiteUrl : "", label: "website", icon: WebsiteLinkIcon },
    { id: "email", href: showPrimaryShortcut("email") ? business.emailInboxUrl : "", label: "email inbox", icon: Mail },
    { id: "admin", href: showPrimaryShortcut("admin") ? business.adminUrl : "", label: "admin panel", icon: Settings2 },
    { id: "hosting", href: showPrimaryShortcut("hosting") ? business.hostingUrl : "", label: "hosting", icon: Server },
    { id: "domain", href: showPrimaryShortcut("domain") ? business.domainUrl : "", label: "domain", icon: Route },
    ...business.socials.filter((social) => social.showOnCard !== false).map((social) => ({ id: `social-${social.id}`, href: social.profileUrl, label: social.platform, icon: socialIcons[social.platform] })),
    ...business.links.filter((link) => link.showOnCard !== false).map((link) => ({ id: `link-${link.id}`, href: link.url, label: link.label, icon: iconForBusinessLink(link) })),
  ].filter((item) => item.href);
  const visibleQuickLinks = quickLinks.slice(0, 8);
  const hiddenQuickLinkCount = quickLinks.length - visibleQuickLinks.length;
  return (
    <article className="panel interactive-card group flex h-full flex-col rounded-[22px] p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-foreground text-sm font-semibold text-background">
          {business.logoUrl ? <Image src={business.logoUrl} alt="" width={48} height={48} className="size-full object-cover" /> : initials(business.name)}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={workspaceHref} className="block truncate font-semibold tracking-tight hover:underline">{business.name}</Link>
          <p className="muted mt-1 min-h-[2.875rem] line-clamp-2 text-sm leading-relaxed">{business.description}</p>
        </div>
      </div>
      <div className="mb-5"><WebsiteStatusBadge status={business.websiteStatus} /></div>
      <div className="mb-5 flex flex-wrap gap-2">
        {visibleQuickLinks.map((item) => <ExternalShortcut key={item.id} href={item.href} label={item.label} icon={item.icon} />)}
        {hiddenQuickLinkCount > 0 && <Link href={workspaceHref} aria-label={`Open workspace to view ${hiddenQuickLinkCount} more links`} title={`${hiddenQuickLinkCount} more links`} className="inline-flex size-9 items-center justify-center rounded-xl border bg-[var(--panel)] text-xs font-semibold transition hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-foreground/5">+{hiddenQuickLinkCount}</Link>}
      </div>
      <Link href={workspaceHref} className="workspace-action muted mt-auto flex items-center justify-between border-t pt-4 text-sm font-medium transition hover:text-foreground">
        Open workspace <ArrowUpRight className="workspace-arrow size-4" />
      </Link>
    </article>
  );
}

type BusinessInput = z.input<typeof businessSchema>;

const optionalBusinessLinks = [
  { value: "website", label: "Website link" },
  { value: "email", label: "Email inbox" },
  { value: "admin", label: "Admin panel" },
  { value: "domain", label: "Domain dashboard" },
  { value: "hosting", label: "Hosting dashboard" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X" },
  { value: "facebook", label: "Facebook Page" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "business-suite", label: "Business Suite" },
  { value: "github", label: "GitHub repository" },
  { value: "github-profile", label: "GitHub profile" },
  { value: "threads", label: "Threads" },
  { value: "reddit", label: "Reddit" },
  { value: "blog", label: "Blog" },
  { value: "other-social", label: "Other social profile" },
  { value: "other", label: "Other" },
] as const;

const businessFormLinkOptions = optionalBusinessLinks.filter(({ value }) => ![
  "linkedin", "instagram", "x", "facebook", "youtube", "tiktok",
  "github-profile", "threads", "reddit", "blog", "other-social",
].includes(value));

type OptionalBusinessLinkKind = typeof optionalBusinessLinks[number]["value"];
type OptionalBusinessLinkRow = {
  id: string;
  kind: OptionalBusinessLinkKind;
  url: string;
  label?: string;
  showOnCard: boolean;
  sourceId?: string;
  isNew: boolean;
};

const socialPlatformByKind: Partial<Record<OptionalBusinessLinkKind, Business["socials"][number]["platform"]>> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  facebook: "Facebook",
  tiktok: "TikTok",
  "github-profile": "GitHub",
  threads: "Threads",
  reddit: "Reddit",
  blog: "Blog",
  "other-social": "Other",
};

function businessLinkRows(business?: Business): OptionalBusinessLinkRow[] {
  if (!business) return [];
  const rows: OptionalBusinessLinkRow[] = [];
  const add = (kind: OptionalBusinessLinkKind, url: string, options?: { label?: string; showOnCard?: boolean; sourceId?: string }) => {
    if (url) rows.push({
      id: crypto.randomUUID(),
      kind,
      url,
      label: options?.label,
      showOnCard: options?.showOnCard !== false,
      sourceId: options?.sourceId,
      isNew: false,
    });
  };
  add("website", business.websiteUrl, { showOnCard: business.cardShortcutVisibility?.website });
  add("email", business.emailInboxUrl, { showOnCard: business.cardShortcutVisibility?.email });
  add("admin", business.adminUrl, { showOnCard: business.cardShortcutVisibility?.admin });
  add("domain", business.domainUrl, { showOnCard: business.cardShortcutVisibility?.domain });
  add("hosting", business.hostingUrl, { showOnCard: business.cardShortcutVisibility?.hosting });
  const businessSuite = business.links.find((link) => link.label === "Business Suite");
  if (businessSuite) add("business-suite", businessSuite.url, { showOnCard: businessSuite.showOnCard, sourceId: businessSuite.id });
  const githubRepository = business.links.find((link) => link.label === "GitHub repository");
  if (githubRepository) add("github", githubRepository.url, { showOnCard: githubRepository.showOnCard, sourceId: githubRepository.id });
  for (const link of business.links.filter((item) => !["Business Suite", "GitHub repository"].includes(item.label))) {
    add("other", link.url, { label: link.label, showOnCard: link.showOnCard, sourceId: link.id });
  }
  return rows;
}

export function BusinessForm({ open, onOpenChange, business }: { open: boolean; onOpenChange: (value: boolean) => void; business?: Business }) {
  const { addBusiness, updateBusiness } = useAppStore();
  const [linkRows, setLinkRows] = useState<OptionalBusinessLinkRow[]>([]);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<BusinessInput>({
    resolver: zodResolver(businessSchema),
    defaultValues: business ? {
      name: business.name, description: business.description,
      websiteUrl: "", emailInboxUrl: "", adminUrl: "", hostingUrl: "", domainUrl: "",
    } : { name: "", description: "", websiteUrl: "", emailInboxUrl: "", adminUrl: "", hostingUrl: "", domainUrl: "" },
  });
  useEffect(() => {
    if (open) {
      reset(business ? {
        name: business.name, description: business.description,
        websiteUrl: "", emailInboxUrl: "", adminUrl: "", hostingUrl: "", domainUrl: "",
      } : { name: "", description: "", websiteUrl: "", emailInboxUrl: "", adminUrl: "", hostingUrl: "", domainUrl: "" });
      // Rehydrate optional link rows whenever the selected business changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLinkRows(businessLinkRows(business));
    }
  }, [business, open, reset]);
  const submit = async (values: BusinessInput) => {
    const parsed = businessSchema.parse(values);
    const invalidLink = linkRows.find((row) => !/^https?:\/\/.+/i.test(row.url.trim()));
    if (invalidLink) {
      toast.error("Every added link must begin with http:// or https://");
      return;
    }
    const rowFor = (kind: OptionalBusinessLinkKind) => linkRows.find((row) => row.kind === kind);
    const urlFor = (kind: OptionalBusinessLinkKind) => rowFor(kind)?.url.trim() || "";
    const businessSuiteRow = rowFor("business-suite");
    const githubRow = rowFor("github");
    const otherLinks = linkRows.filter((row) => row.kind === "other");
    const invalidOther = otherLinks.find((row) => !row.label?.trim());
    if (invalidOther) {
      toast.error("Add a label for every Other link");
      return;
    }
    const links = [
      ...(businessSuiteRow ? [{
        id: business?.links.find((link) => link.id === businessSuiteRow.sourceId)?.id || crypto.randomUUID(),
        label: "Business Suite",
        url: businessSuiteRow.url.trim(),
        category: "Social" as const,
        showOnCard: businessSuiteRow.showOnCard,
      }] : []),
      ...(githubRow ? [{
        id: business?.links.find((link) => link.id === githubRow.sourceId)?.id || crypto.randomUUID(),
        label: "GitHub repository",
        url: githubRow.url.trim(),
        category: "Development" as const,
        showOnCard: githubRow.showOnCard,
      }] : []),
      ...otherLinks.map((row) => ({
        id: business?.links.find((link) => link.id === row.sourceId)?.id || crypto.randomUUID(),
        label: row.label!.trim(),
        url: row.url.trim(),
        category: "Other" as const,
        showOnCard: row.showOnCard,
      })),
    ];
    const cardShortcutVisibility = {
      website: rowFor("website")?.showOnCard ?? true,
      email: rowFor("email")?.showOnCard ?? true,
      admin: rowFor("admin")?.showOnCard ?? true,
      hosting: rowFor("hosting")?.showOnCard ?? true,
      domain: rowFor("domain")?.showOnCard ?? true,
    };
    const businessValues = {
      ...parsed,
      websiteUrl: urlFor("website"),
      emailInboxUrl: urlFor("email"),
      domainUrl: urlFor("domain"),
      hostingUrl: urlFor("hosting"),
      adminUrl: urlFor("admin"),
      cardShortcutVisibility,
      links,
    };
    if (business) {
      updateBusiness(business.id, businessValues);
      toast.success("Business updated");
      onOpenChange(false);
      return;
    }
    try {
      const result = await addBusiness({
        ...businessValues,
        emailProvider: "Custom",
        notes: "",
        socials: [],
      });
      onOpenChange(false);
      if (result.warning) toast.error(result.warning);
      else toast.success("Business added");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Business could not be created");
    }
  };
  return (
    <Modal
      open={open}
      onOpenChange={(value) => { if (!isSubmitting) onOpenChange(value); }}
      title={business ? "Edit business" : "Add a business"}
      description="Update the business details and choose which shortcuts appear on its card."
      contentClassName="max-w-4xl overflow-hidden p-0"
      headerClassName="mb-0 border-b px-6 py-5 pr-16 sm:px-7 sm:py-6"
      bodyClassName="max-h-[calc(90vh-105px)] overflow-y-auto"
    >
      <form onSubmit={handleSubmit(submit)}>
        <div className="space-y-7 p-5 sm:p-7">
          <div className="grid gap-5 md:grid-cols-[minmax(0,.78fr)_minmax(0,1.22fr)]">
            <Field label="Business name *" error={errors.name?.message}>
              <input {...register("name")} className={inputClass} placeholder="Northstar Studio" />
            </Field>
            <Field label="Description *" error={errors.description?.message}>
              <textarea {...register("description")} className="premium-input min-h-20 rounded-xl border p-3 text-sm transition focus:border-foreground/35" placeholder="What does this business do?" />
            </Field>
          </div>
          <div className="border-t pt-6">
            <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div>
                <p className="font-medium">Business links</p>
                <p className="muted mt-1 max-w-lg text-sm">Add website and operational shortcuts here. Social accounts can be added after opening the business workspace.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-9 shrink-0 whitespace-nowrap px-3"
                onClick={() => setLinkRows((rows) => [...rows, { id: crypto.randomUUID(), kind: "website", url: "", label: "", showOnCard: true, isNew: true }])}
              >
                <Plus className="size-4" /> Add link
              </Button>
            </div>
          <div className="overflow-hidden rounded-2xl border bg-foreground/[.012]">
            {!!linkRows.length && (
              <div className="muted hidden grid-cols-[180px_minmax(0,1fr)_116px_36px] gap-3 border-b bg-foreground/[.025] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[.08em] lg:grid">
                <span>Type</span><span>Destination</span><span>Card</span><span />
              </div>
            )}
            <div className="divide-y">
              {linkRows.map((row) => (
              <div key={row.id} className="grid gap-3 p-3.5 transition hover:bg-foreground/[.018] sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[180px_minmax(0,1fr)_116px_36px] lg:items-center lg:px-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:block">
                  <label className="muted text-[11px] font-medium uppercase tracking-[.08em] lg:hidden">Type</label>
                  <div className="grid gap-2 sm:col-span-2 lg:block">
                    {row.isNew ? (
                    <SelectControl
                      value={row.kind}
                      onValueChange={(kind) => setLinkRows((rows) => rows.map((item) => item.id === row.id ? { ...item, kind: kind as OptionalBusinessLinkKind } : item))}
                      options={businessFormLinkOptions}
                      className="h-10"
                      ariaLabel="Choose link type"
                    />
                    ) : (
                      <div className="flex h-10 items-center rounded-xl border bg-foreground/[.025] px-3 text-sm font-medium" aria-label={`Link type: ${optionalBusinessLinks.find((option) => option.value === row.kind)?.label}`}>
                        <span className="mr-2 size-1.5 rounded-full bg-foreground/45" aria-hidden="true" />
                        <span className="truncate">{optionalBusinessLinks.find((option) => option.value === row.kind)?.label}</span>
                      </div>
                    )}
                  </div>
                  {row.kind === "other" && (
                    <input
                      value={row.label || ""}
                      onChange={(event) => setLinkRows((rows) => rows.map((item) => item.id === row.id ? { ...item, label: event.target.value } : item))}
                      className={`${inputClass} mt-2 h-10`}
                      placeholder="Link label"
                      aria-label="Other link label"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="muted mb-2 block text-[11px] font-medium uppercase tracking-[.08em] lg:hidden">Destination</label>
                  <input
                    type="url"
                    value={row.url}
                    onChange={(event) => setLinkRows((rows) => rows.map((item) => item.id === row.id ? { ...item, url: event.target.value } : item))}
                    className={`${inputClass} h-10 font-mono text-xs`}
                    placeholder="https://…"
                    aria-label={`${optionalBusinessLinks.find((option) => option.value === row.kind)?.label} URL`}
                    required
                  />
                </div>
                <CardVisibilitySwitch
                  checked={row.showOnCard}
                  onCheckedChange={(checked) => setLinkRows((rows) => rows.map((item) => item.id === row.id ? { ...item, showOnCard: checked } : item))}
                  accessibleLabel={`Show ${optionalBusinessLinks.find((option) => option.value === row.kind)?.label} on business card`}
                  className="sm:justify-start"
                  promptClassName="lg:hidden"
                />
                <button
                  type="button"
                  onClick={() => setLinkRows((rows) => rows.filter((item) => item.id !== row.id))}
                  className="muted grid size-9 place-items-center justify-self-end rounded-xl border transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500 sm:self-end lg:self-auto"
                  aria-label="Remove link"
                  title="Remove link"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              ))}
            </div>
            {!linkRows.length && <div className="muted grid min-h-28 place-items-center p-5 text-center text-sm">No links added yet.</div>}
          </div>
        </div>
        </div>
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t bg-[color:color-mix(in_srgb,var(--panel-solid)_88%,transparent)] px-5 py-4 backdrop-blur-xl sm:px-7">
          <p className="muted hidden text-xs sm:block">{linkRows.filter((row) => row.showOnCard).length} shortcuts shown on the card</p>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}><Check className="size-4" /> {isSubmitting ? "Saving…" : business ? "Save changes" : "Add business"}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function LinkForm({ business, open, onOpenChange }: { business: Business; open: boolean; onOpenChange: (value: boolean) => void }) {
  const { updateBusiness } = useAppStore();
  const [kind, setKind] = useState<OptionalBusinessLinkKind>("website");
  const [url, setUrl] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  const close = () => {
    setKind("website");
    setUrl("");
    setCustomLabel("");
    onOpenChange(false);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanUrl = url.trim();
    if (!/^https?:\/\/.+/i.test(cleanUrl)) {
      toast.error("Enter a full URL beginning with http:// or https://");
      return;
    }
    if (kind === "website") updateBusiness(business.id, { websiteUrl: cleanUrl });
    else if (kind === "email") updateBusiness(business.id, { emailInboxUrl: cleanUrl });
    else if (kind === "admin") updateBusiness(business.id, { adminUrl: cleanUrl });
    else if (kind === "domain") updateBusiness(business.id, { domainUrl: cleanUrl });
    else if (kind === "hosting") updateBusiness(business.id, { hostingUrl: cleanUrl });
    else if (socialPlatformByKind[kind]) {
      const platform = socialPlatformByKind[kind];
      const existingSocial = business.socials.find((social) => social.platform === platform);
      updateBusiness(business.id, {
        socials: [
          ...business.socials.filter((social) => social.platform !== platform),
          {
            id: existingSocial?.id || crypto.randomUUID(),
            platform,
            accountName: business.name,
            username: "",
            profileUrl: cleanUrl,
            showOnCard: existingSocial?.showOnCard ?? true,
          },
        ],
      });
    } else {
      const label = kind === "github" ? "GitHub repository"
        : kind === "business-suite" ? "Business Suite"
          : customLabel.trim();
      if (!label) {
        toast.error("Add a label for this link");
        return;
      }
      updateBusiness(business.id, {
        links: [
          ...business.links.filter((link) => link.label !== label),
          {
            id: business.links.find((link) => link.label === label)?.id || crypto.randomUUID(),
            label,
            url: cleanUrl,
            category: kind === "github" ? "Development" : kind === "business-suite" ? "Social" : "Other",
            showOnCard: business.links.find((link) => link.label === label)?.showOnCard ?? true,
          },
        ],
      });
    }
    toast.success(`${optionalBusinessLinks.find((option) => option.value === kind)?.label} added`);
    close();
  };

  return (
    <Modal open={open} onOpenChange={(value) => value ? onOpenChange(true) : close()} title="Add business link" description="Choose the same link type used when adding or editing a business.">
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Link type">
          <SelectControl value={kind} onValueChange={(value) => setKind(value as OptionalBusinessLinkKind)} options={optionalBusinessLinks} />
        </Field>
        {kind === "other" && (
          <Field label="Link label">
            <input value={customLabel} onChange={(event) => setCustomLabel(event.target.value)} className={inputClass} placeholder="Support portal" required />
          </Field>
        )}
        <Field label="URL">
          <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} className={inputClass} placeholder="https://…" required />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
          <Button type="submit"><Plus className="size-4" /> Add link</Button>
        </div>
      </form>
    </Modal>
  );
}

export function SocialForm({ businessId, open, onOpenChange, social }: {
  businessId: string;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  social?: Business["socials"][number];
}) {
  const { addSocial, businesses, updateBusiness } = useAppStore();
  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<z.input<typeof socialAccountSchema>>({
    resolver: zodResolver(socialAccountSchema),
    defaultValues: { platform: "LinkedIn", accountName: "", username: "", profileUrl: "", showOnCard: true },
  });
  useEffect(() => {
    if (!open) return;
    reset(social ? {
      platform: social.platform,
      accountName: social.accountName,
      username: social.username,
      profileUrl: social.profileUrl,
      showOnCard: social.showOnCard !== false,
    } : {
      platform: "LinkedIn",
      accountName: "",
      username: "",
      profileUrl: "",
      showOnCard: true,
    });
  }, [open, reset, social]);

  const submit = (values: z.input<typeof socialAccountSchema>) => {
    const parsed = socialAccountSchema.parse(values);
    if (social) {
      const business = businesses.find((item) => item.id === businessId);
      if (!business) {
        toast.error("Business could not be found");
        return;
      }
      updateBusiness(businessId, {
        socials: business.socials.map((item) => item.id === social.id ? { ...item, ...parsed } : item),
      });
      toast.success("Social account updated");
    } else {
      addSocial(businessId, parsed);
      toast.success("Social account added");
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={social ? "Edit social account" : "Add social account"} description="The account opens directly in a new tab. No passwords or analytics are stored.">
      <form className="grid gap-4" onSubmit={handleSubmit(submit)}>
        <Field label="Platform" error={errors.platform?.message}>
          <Controller name="platform" control={control} render={({ field }) => <SelectControl ariaLabel="Platform" value={field.value} onValueChange={field.onChange} options={["LinkedIn", "Instagram", "X", "YouTube", "Facebook", "TikTok", "GitHub", "Threads", "Reddit", "Blog", "Other"]} /> } />
        </Field>
        {!social && <Field label="Account name" error={errors.accountName?.message}><input {...register("accountName")} className={inputClass} placeholder="Northstar Studio" /></Field>}
        <Field label="Username" error={errors.username?.message}><input {...register("username")} className={inputClass} placeholder="@northstar" /></Field>
        <Field label="Profile URL" error={errors.profileUrl?.message}><input {...register("profileUrl")} className={inputClass} placeholder="https://linkedin.com/company/…" /></Field>
        <Controller
          name="showOnCard"
          control={control}
          render={({ field }) => (
            <CardVisibilitySwitch
              checked={field.value !== false}
              onCheckedChange={field.onChange}
              accessibleLabel="Show this social account on the business card"
              className="rounded-xl border bg-foreground/[.02] px-3 py-3"
            />
          )}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit">{social ? <Check className="size-4" /> : <Plus className="size-4" />}{social ? "Save changes" : "Add social account"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function EmptyBusinesses({ onAdd }: { onAdd: () => void }) {
  return <div className="panel grid min-h-80 place-items-center rounded-3xl p-8 text-center"><div><span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-foreground text-background"><Building2 className="size-5" /></span><h2 className="font-semibold">Add your first business</h2><p className="muted mx-auto mt-2 max-w-sm text-sm">Keep its website, inbox, social accounts and important links together.</p><Button onClick={onAdd} className="mt-5"><Plus className="size-4" /> Add business</Button></div></div>;
}
