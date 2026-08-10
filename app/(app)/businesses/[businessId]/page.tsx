"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import {
  Archive, ExternalLink, Mail, Pencil, Plus, RotateCcw, Route, Server,
  Settings2, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/components/app-store";
import { BusinessForm, ExternalShortcut, LinkForm, SocialForm, SocialPlatformIcon, WebsiteLinkIcon, WebsiteStatusBadge, checkBusinessWebsite, iconForBusinessLink } from "@/components/businesses";
import { BusinessKeyVault } from "@/components/key-vault";
import { Button, Modal, SectionHeading } from "@/components/ui";
import { initials } from "@/lib/utils";

export default function BusinessDetailPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const router = useRouter();
  const { businesses, updateBusiness, removeBusiness, setStatus } = useAppStore();
  const business = businesses.find((item) => item.id === businessId);
  const [edit, setEdit] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!business) return <div className="panel rounded-3xl p-10 text-center"><h1 className="text-xl font-semibold">Business not found</h1><Button className="mt-5" onClick={() => router.push("/businesses")}>Return to businesses</Button></div>;
  return (
    <>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid size-16 shrink-0 place-items-center rounded-[20px] bg-foreground text-xl font-semibold text-background">{initials(business.name)}</div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{business.name}</h1>
            <WebsiteStatusBadge status={business.websiteStatus} />
            <span className="muted text-xs">
              {business.lastCheckedAt ? `Last checked ${format(new Date(business.lastCheckedAt), "dd MMM yyyy, h:mm:ss a")}` : "Not checked yet"}
            </span>
          </div>
          <p className="muted max-w-2xl text-sm">{business.description}</p>
        </div>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => checkBusinessWebsite(business, setStatus)} disabled={business.websiteStatus === "checking"}>Check now</Button><Button variant="secondary" onClick={() => setEdit(true)}><Pencil className="size-4" /> Edit</Button><Button variant="secondary" onClick={() => { updateBusiness(business.id, { isActive: !business.isActive }); toast.success(business.isActive ? "Business archived" : "Business restored"); }}>{business.isActive ? <Archive className="size-4" /> : <RotateCcw className="size-4" />}{business.isActive ? "Archive" : "Restore"}</Button></div>
      </div>
      <section className="mb-9">
        <SectionHeading title="Quick access" description="Your primary business tools and other saved links." action={<Button variant="secondary" onClick={() => setLinkOpen(true)}><Plus className="size-4" /> Add link</Button>} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <ExternalShortcut href={business.websiteUrl} label="Website" icon={WebsiteLinkIcon} large />
          <ExternalShortcut href={business.emailInboxUrl} label="Email inbox" icon={Mail} large />
          <ExternalShortcut href={business.adminUrl} label="Admin panel" icon={Settings2} large />
          <ExternalShortcut href={business.hostingUrl} label="Hosting" icon={Server} large />
          <ExternalShortcut href={business.domainUrl} label="Domain" icon={Route} large />
          {business.links.map((link) => (
            <ExternalShortcut
              key={link.id}
              href={link.url}
              label={link.label}
              icon={iconForBusinessLink(link)}
              large
            />
          ))}
        </div>
      </section>
      <div className="grid gap-8 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-8">
          <section><SectionHeading title="Social accounts" description="Configured profiles only—no analytics." action={<Button variant="secondary" onClick={() => setSocialOpen(true)}><Plus className="size-4" /> Add account</Button>} /><div className="panel divide-y overflow-hidden rounded-2xl">{business.socials.length ? business.socials.map((social) => <a key={social.id} href={social.profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 transition hover:bg-foreground/5"><span className="grid size-9 place-items-center rounded-xl border bg-foreground/[.025]"><SocialPlatformIcon platform={social.platform} /></span><span><span className="block text-sm font-medium">{social.platform}</span><span className="muted text-xs">{social.username || social.accountName}</span></span><ExternalLink className="muted ml-auto size-4" /></a>) : <p className="muted p-6 text-sm">No social accounts configured.</p>}</div></section>
          <BusinessKeyVault businessId={business.id} />
        </div>
        <div className="space-y-8">
          <section>
            <SectionHeading title="Business notes" />
            <div className="panel rounded-2xl p-5">
              <textarea
                value={business.notes}
                onChange={(event) => updateBusiness(business.id, { notes: event.target.value })}
                className="muted min-h-40 w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
                aria-label="Business notes"
                placeholder="Write your things here…"
              />
            </div>
          </section>
          <section className="panel rounded-2xl p-5">
            <h2 className="font-semibold">Website check</h2>
            <dl className="muted mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs">HTTP status</dt><dd className="mt-1 text-foreground">{business.httpStatusCode || "—"}</dd></div>
              <div><dt className="text-xs">Response time</dt><dd className="mt-1 text-foreground">{business.responseTimeMs ? `${business.responseTimeMs} ms` : "—"}</dd></div>
              <div className="col-span-2 border-t pt-4">
                <dt className="text-xs">Last checked</dt>
                <dd className="mt-1 text-foreground">{business.lastCheckedAt ? format(new Date(business.lastCheckedAt), "dd MMM yyyy, h:mm:ss a") : "Not checked yet"}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-2xl border border-red-500/15 p-5"><h2 className="font-semibold">Danger zone</h2><p className="muted mt-1 text-sm">Permanently remove this business and its related shortcuts.</p><Button variant="danger" className="mt-4" onClick={() => setConfirmDelete(true)}><Trash2 className="size-4" /> Delete business</Button></section>
        </div>
      </div>
      <BusinessForm open={edit} onOpenChange={setEdit} business={business} /><LinkForm business={business} open={linkOpen} onOpenChange={setLinkOpen} /><SocialForm businessId={business.id} open={socialOpen} onOpenChange={setSocialOpen} />
      <Modal open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete this business?" description="This removes the business and its related links from the current workspace."><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" onClick={() => { removeBusiness(business.id); toast.success("Business deleted"); router.push("/businesses"); }}>Delete permanently</Button></div></Modal>
    </>
  );
}
