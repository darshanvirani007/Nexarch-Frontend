"use client";

import { useState } from "react";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/components/app-store";
import { MotionList } from "@/components/motion";
import { Button, Field, inputClass, Modal, ProgressBar, SelectControl } from "@/components/ui";
import { progress } from "@/lib/utils";
import type { Goal } from "@/lib/types";

function formatMeasure(value: number, unit: string) {
  if (unit === "Euro" || unit === "€") return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  return `${value.toLocaleString("en-IE")} ${unit}`;
}

export default function GoalsPage() {
  const { goals, setGoals } = useAppStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Professional");
  const [currentValue, setCurrentValue] = useState("0");
  const [targetValue, setTargetValue] = useState("15000");
  const [unit, setUnit] = useState("Euro");
  const [deadline, setDeadline] = useState("2026-12-31");
  const [activeCategory, setActiveCategory] = useState("All goals");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [updatedValue, setUpdatedValue] = useState("");
  const visibleGoals = activeCategory === "All goals" ? goals : goals.filter((goal) => goal.category === activeCategory);
  const activeGoals = visibleGoals.filter((goal) => goal.status !== "Completed");
  const completedGoals = visibleGoals.filter((goal) => goal.status === "Completed");
  return <>
    <PageHeader eyebrow="Direction" title="Goals" description="Keep the outcomes you are working towards visible." action={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add goal</Button>} />
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{["All goals","Financial","Professional","Business"].map((item) => <button key={item} onClick={() => setActiveCategory(item)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${activeCategory === item ? "bg-foreground text-background" : "muted"}`}>{item}</button>)}</div>
    <MotionList className="grid gap-4 lg:grid-cols-2">{activeGoals.map((goal) => { const value = progress(goal.currentValue, goal.targetValue); return <article key={goal.id} className="panel interactive-card rounded-[22px] p-6"><div className="mb-7 flex items-start justify-between gap-4"><div><p className="muted text-xs uppercase tracking-wider">{goal.category}</p><h2 className="mt-2 text-lg font-semibold">{goal.title}</h2></div><span className="muted rounded-full border px-2.5 py-1 text-xs">{goal.status}</span></div><div className="mb-3 flex items-end justify-between gap-4"><p className="text-3xl font-semibold tracking-tight">{formatMeasure(goal.currentValue, goal.unit)} <span className="muted text-base font-normal">of {formatMeasure(goal.targetValue, goal.unit)}</span></p><p className="muted shrink-0 text-xs">{value}% complete</p></div><ProgressBar value={value} /><div className="mt-4 flex items-center justify-between gap-3"><p className="muted text-xs">Deadline · {goal.deadline}</p><div className="flex gap-1"><Button variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => { setEditingGoal(goal); setUpdatedValue(String(goal.currentValue)); }}><Pencil className="size-3.5" /> Update progress</Button><Button variant="ghost" className="h-8 px-2 text-xs hover:text-red-500" onClick={() => setDeletingGoal(goal)} aria-label={`Delete ${goal.title}`}><Trash2 className="size-3.5" /></Button></div></div></article>; })}</MotionList>
    <section className="mt-10">
      <div className="mb-4"><h2 className="text-lg font-semibold">Completed goals</h2><p className="muted mt-1 text-sm">Finished goals are kept together below your active goals.</p></div>
      <div className="panel divide-y overflow-hidden rounded-[22px]">
        {completedGoals.length ? completedGoals.map((goal) => <div key={goal.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><CheckCircle2 className="size-5 shrink-0 text-emerald-500" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{goal.title}</p><p className="muted mt-1 text-xs">{goal.category} · {formatMeasure(goal.targetValue, goal.unit)} achieved</p></div><span className="muted text-xs">Completed</span><Button variant="ghost" className="h-8 px-2 text-xs hover:text-red-500" onClick={() => setDeletingGoal(goal)} aria-label={`Delete ${goal.title}`}><Trash2 className="size-3.5" /></Button></div>) : <p className="muted p-5 text-sm">Completed goals will appear here.</p>}
      </div>
    </section>
    <Modal open={open} onOpenChange={setOpen} title="Add a measurable goal" description="Set the number you want to reach and update it as you make progress."><form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); const current = Number(currentValue); const target = Number(targetValue); if (title.trim().length < 2 || !Number.isFinite(current) || !Number.isFinite(target) || current < 0 || target <= 0) return toast.error("Enter a valid current and target amount"); setGoals((items) => [...items, { id: crypto.randomUUID(), title, category, currentValue: current, targetValue: target, unit, status: current >= target ? "Completed" : "Not started", deadline }]); toast.success("Goal created"); setOpen(false); setTitle(""); setCurrentValue("0"); }}><Field label="Goal title"><input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="Earn €15,000 this year through business" required /></Field><div className="grid grid-cols-2 gap-4"><Field label="Category"><SelectControl value={category} onValueChange={setCategory} options={["Financial", "Professional", "Business"]} /></Field><Field label="Measure"><SelectControl value={unit} onValueChange={setUnit} options={[{ value: "Euro", label: "Euro (€)" }, "Clients", "Projects", "Sales", "Hours", "Items"]} /></Field></div><div className="grid grid-cols-2 gap-4"><Field label="Current amount"><input type="number" min="0" step="any" value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} className={inputClass} required /></Field><Field label="Target amount"><input type="number" min="0.01" step="any" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className={inputClass} required /></Field></div><Field label="Deadline"><input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className={inputClass} required /></Field><Button type="submit">Create goal</Button></form></Modal>
    <Modal open={Boolean(editingGoal)} onOpenChange={(value) => { if (!value) setEditingGoal(null); }} title="Update goal progress" description={editingGoal ? `${formatMeasure(editingGoal.currentValue, editingGoal.unit)} of ${formatMeasure(editingGoal.targetValue, editingGoal.unit)}` : ""}><form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); if (!editingGoal) return; const next = Number(updatedValue); if (!Number.isFinite(next) || next < 0) return toast.error("Enter a valid amount"); setGoals((items) => items.map((goal) => goal.id === editingGoal.id ? { ...goal, currentValue: next, status: next >= goal.targetValue ? "Completed" : "On track" } : goal)); toast.success("Goal progress updated"); setEditingGoal(null); }}><Field label={`Current ${editingGoal?.unit || "amount"}`}><input type="number" min="0" step="any" value={updatedValue} onChange={(event) => setUpdatedValue(event.target.value)} className={inputClass} required /></Field><Button type="submit">Save progress</Button></form></Modal>
    <Modal open={Boolean(deletingGoal)} onOpenChange={(value) => { if (!value) setDeletingGoal(null); }} title="Delete this goal?" description={deletingGoal?.title || ""}><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeletingGoal(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (!deletingGoal) return; setGoals((items) => items.filter((goal) => goal.id !== deletingGoal.id)); toast.success("Goal deleted"); setDeletingGoal(null); }}><Trash2 className="size-4" /> Delete goal</Button></div></Modal>
  </>;
}
