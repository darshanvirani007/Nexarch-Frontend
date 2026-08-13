"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/components/app-store";
import { BusinessCard, BusinessForm, EmptyBusinesses } from "@/components/businesses";
import { MotionList } from "@/components/motion";
import { Button, inputClass } from "@/components/ui";

export default function BusinessesPage() {
  const { businesses } = useAppStore();
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  useEffect(() => {
    const handler = () => setAddOpen(true);
    window.addEventListener("quick-add", handler);
    return () => window.removeEventListener("quick-add", handler);
  }, []);
  const visible = useMemo(() => businesses.filter((business) => business.isActive !== showArchived && `${business.name} ${business.description}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.displayOrder - b.displayOrder), [businesses, query, showArchived]);
  return (
    <>
      <PageHeader eyebrow="Directory" title="Businesses" description="Keep your websites, inboxes, social accounts and important business links together." action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add business</Button>} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><Search className="muted absolute left-3 top-3 size-4" /><span className="sr-only">Search businesses</span><input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} h-10 pl-10`} placeholder="Search businesses…" /></label>
        <Button variant="secondary" onClick={() => setShowArchived((value) => !value)}><Archive className="size-4" /> {showArchived ? "Show active" : "Archived"}</Button>
      </div>
      {visible.length ? <MotionList className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((business) => <BusinessCard key={business.id} business={business} />)}</MotionList> : <EmptyBusinesses onAdd={() => setAddOpen(true)} />}
      <BusinessForm open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
