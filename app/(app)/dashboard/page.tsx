"use client";

import Link from "next/link";
import { Award, BookOpen, BriefcaseBusiness, CalendarCheck2, ChevronRight, ExternalLink, GraduationCap, ListTodo, ShoppingBag } from "lucide-react";
import { DashboardGreeting } from "@/components/app-shell";
import { useAppStore } from "@/components/app-store";
import { BusinessCard } from "@/components/businesses";
import { CommerceAlertList, CommerceTaskList } from "@/components/commerce-tracking";
import { MotionList } from "@/components/motion";
import { SectionHeading } from "@/components/ui";

export default function DashboardPage() {
  const { businesses, tasks, learning, jobApplications } = useAppStore();
  const inProgressLearning = learning.filter((item) => item.status === "In progress");
  const taskAreas = [
    { label: "Daily tasks", detail: "Your day-focused actions", count: tasks.filter((task) => task.area === "Daily").length, href: "/tasks?tab=daily", icon: CalendarCheck2 },
    { label: "Tasks", detail: "Everything else you are tracking", count: tasks.filter((task) => task.area !== "Daily" && task.area !== "Commerce").length, href: "/tasks?tab=general", icon: ListTodo },
    { label: "Job applications", detail: "Roles and application statuses", count: jobApplications.length, href: "/tasks?tab=jobs", icon: BriefcaseBusiness },
  ];
  return (
    <>
      <DashboardGreeting />
      <section className="mb-9"><SectionHeading title="Your spaces" description="Open the accounts, businesses and platforms you use most." action={<Link className="muted flex items-center gap-1 text-sm hover:text-foreground" href="/businesses">View all <ChevronRight className="size-4" /></Link>} /><MotionList className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">{businesses.filter((item) => item.isActive).slice(0, 3).map((business) => <BusinessCard key={business.id} business={business} />)}</MotionList></section>
      <section className="mb-9"><SectionHeading title="Needs your attention" description="Important updates that may require a decision or action." action={<Link className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition hover:bg-foreground/5" href="/commerce"><ShoppingBag className="size-4" /> Open Stores</Link>} /><CommerceAlertList compact /></section>
      <section className="mb-9"><SectionHeading title="Commerce tasks" description="Tasks created from Commerce alerts." /><CommerceTaskList /></section>
      <div className="grid gap-8 xl:grid-cols-2">
        <section><SectionHeading title="Learning" description="Your learning currently in progress." action={<Link className="muted flex items-center gap-1 text-sm hover:text-foreground" href="/learning">View learning <ChevronRight className="size-4" /></Link>} /><div className="panel divide-y overflow-hidden rounded-[22px]">{inProgressLearning.length ? inProgressLearning.map((item) => { const Icon = item.category === "Course" ? GraduationCap : item.category === "Certification" ? Award : BookOpen; return <article key={item.id} className="flex min-h-24 items-center gap-4 p-5"><span className="grid size-11 shrink-0 place-items-center rounded-xl border"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold">{item.title}</h2><p className="muted mt-1 truncate text-xs">{item.category}{item.provider ? ` · ${item.provider}` : ""}</p></div>{item.resourceUrl && <a href={item.resourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.title}`} className="muted rounded-xl p-2.5 transition hover:bg-foreground/5 hover:text-foreground"><ExternalLink className="size-4" /></a>}</article>; }) : <div className="p-8 text-center"><p className="text-sm font-medium">Nothing in progress</p><p className="muted mt-1 text-xs">Items marked In progress will appear here.</p></div>}</div></section>
        <section><SectionHeading title="Task dashboard" description="Your three task areas in one clear view." /><div className="panel divide-y overflow-hidden rounded-[22px]">
          {taskAreas.map(({ label, detail, count, href, icon: Icon }) => <Link key={label} href={href} className="group flex min-h-24 items-center gap-4 p-5 transition hover:bg-foreground/[.035]"><span className="grid size-11 shrink-0 place-items-center rounded-xl border transition group-hover:border-foreground/20"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{label}</h2><p className="muted mt-1 truncate text-xs">{detail}</p></div><span className="text-2xl font-semibold tabular-nums">{count}</span><ChevronRight className="muted size-4 transition group-hover:translate-x-0.5 group-hover:text-foreground" /></Link>)}
        </div></section>
      </div>
    </>
  );
}
