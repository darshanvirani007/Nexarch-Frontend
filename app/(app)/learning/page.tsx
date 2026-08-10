"use client";

import { useMemo, useState } from "react";
import { Award, BookOpen, Check, Circle, ExternalLink, GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/components/app-store";
import { MotionList } from "@/components/motion";
import { Button, Field, inputClass, Modal, SectionHeading, SelectControl } from "@/components/ui";
import type { LearningItem } from "@/lib/types";

const categories = [
  { name: "Course" as const, label: "Courses", icon: GraduationCap },
  { name: "Certification" as const, label: "Certifications", icon: Award },
  { name: "Book" as const, label: "Books", icon: BookOpen },
];

export default function LearningPage() {
  const { learning, setLearning } = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<LearningItem | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<LearningItem["category"]>("Course");
  const [provider, setProvider] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [status, setStatus] = useState<LearningItem["status"]>("To learn");
  const [activeCategory, setActiveCategory] = useState<LearningItem["category"]>("Course");

  const completedItems = useMemo(
    () => learning.filter((item) => item.status === "Completed"),
    [learning],
  );
  const activeCategoryConfig = categories.find((item) => item.name === activeCategory) ?? categories[0];
  const activeItems = learning.filter((item) => item.category === activeCategory && item.status !== "Completed");

  const toggleComplete = (id: string) => {
    const completing = learning.find((item) => item.id === id)?.status !== "Completed";
    setLearning((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Completed" ? "In progress" : "Completed" }
        : item,
      ),
    );
    toast.success(completing ? "Learning completed" : "Learning moved to in progress");
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCategory(activeCategory);
    setProvider("");
    setResourceUrl("");
    setStatus("To learn");
  };

  const openAddForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (item: LearningItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setProvider(item.provider);
    setResourceUrl(item.resourceUrl);
    setStatus(item.status);
    setFormOpen(true);
  };

  const deleteLearning = () => {
    if (!deletingItem) return;
    setLearning((items) => items.filter((item) => item.id !== deletingItem.id));
    toast.success("Learning item deleted");
    setDeletingItem(null);
  };

  const saveLearning = (event: React.FormEvent) => {
    event.preventDefault();
    if (title.trim().length < 2) return;
    const values = {
      title: title.trim(),
      category,
      provider: provider.trim(),
      status,
      resourceUrl: resourceUrl.trim(),
    };
    if (editingId) {
      setLearning((items) =>
        items.map((item) => item.id === editingId ? { ...item, ...values } : item),
      );
      toast.success("Learning item updated");
    } else {
      setLearning((items) => [{ id: crypto.randomUUID(), ...values }, ...items]);
      toast.success(`${category} added`);
    }
    setActiveCategory(category);
    setFormOpen(false);
    resetForm();
  };

  return (
    <>
      <PageHeader
        eyebrow="Personal library"
        title="Learning"
        description="Keep track of everything you are currently learning and improving."
        action={<Button onClick={openAddForm}><Plus className="size-4" /> Add learning</Button>}
      />

      <div className="mb-9 grid gap-3 sm:grid-cols-2">
        <div className="panel rounded-2xl p-5">
          <p className="text-2xl font-semibold">{learning.length}</p>
          <p className="muted mt-1 text-xs">Total learning items</p>
        </div>
        <div className="panel rounded-2xl p-5">
          <p className="text-2xl font-semibold">{completedItems.length}</p>
          <p className="muted mt-1 text-xs">Completed</p>
        </div>
      </div>

      <div className="scrollbar-none mb-8 flex gap-1 overflow-x-auto rounded-2xl border bg-foreground/[.025] p-1.5" role="tablist" aria-label="Learning categories">
        {categories.map(({ name, label, icon: Icon }) => {
          const count = learning.filter((item) => item.category === name).length;
          const active = activeCategory === name;
          return <button
            key={name}
            id={`learning-tab-${name.toLowerCase()}`}
            role="tab"
            aria-selected={active}
            aria-controls={`learning-panel-${name.toLowerCase()}`}
            onClick={() => setActiveCategory(name)}
            className={`flex min-w-fit flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${active ? "bg-foreground text-background shadow-sm" : "muted hover:bg-foreground/5 hover:text-foreground"}`}
          >
            <Icon className="size-4" />
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-background/15" : "bg-foreground/5"}`}>{count}</span>
          </button>;
        })}
      </div>

      <section
        id={`learning-panel-${activeCategory.toLowerCase()}`}
        role="tabpanel"
        aria-labelledby={`learning-tab-${activeCategory.toLowerCase()}`}
      >
        <SectionHeading
          title={activeCategoryConfig.label}
          description={`${activeItems.length} ${activeItems.length === 1 ? "item" : "items"}`}
        />
        {activeItems.length ? (
          <MotionList className="grid gap-3 lg:grid-cols-2">
            {activeItems.map((item) => (
              <article
                key={item.id}
                className={`panel interactive-card flex items-center gap-4 rounded-2xl p-4 ${
                  item.status === "Completed" ? "opacity-65" : "hover:border-foreground/20"
                }`}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border">
                  <activeCategoryConfig.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={`truncate text-sm font-semibold ${item.status === "Completed" ? "line-through" : ""}`}>
                    {item.title}
                  </h2>
                  <p className="muted mt-1 truncate text-xs">
                    {[item.provider, item.status].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {item.resourceUrl && (
                  <a
                    href={item.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${item.title}`}
                    className="muted rounded-xl p-2.5 transition hover:bg-foreground/5 hover:text-foreground"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
                <button
                  onClick={() => openEditForm(item)}
                  aria-label={`Edit ${item.title}`}
                  className="muted grid size-10 shrink-0 place-items-center rounded-xl border transition hover:bg-foreground/5 hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => setDeletingItem(item)}
                  aria-label={`Delete ${item.title}`}
                  className="muted grid size-10 shrink-0 place-items-center rounded-xl border transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="size-4" />
                </button>
                <button
                  onClick={() => toggleComplete(item.id)}
                  aria-label={item.status === "Completed" ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`}
                  className={`grid size-10 shrink-0 place-items-center rounded-xl border transition ${
                    item.status === "Completed"
                      ? "bg-foreground text-background"
                      : "hover:bg-foreground/5"
                  }`}
                >
                  {item.status === "Completed" ? <Check className="size-4" /> : <Circle className="size-4" />}
                </button>
              </article>
            ))}
          </MotionList>
        ) : (
          <div className="panel muted flex min-h-28 items-center justify-center rounded-2xl p-4 text-center text-sm">
            <div><p className="font-medium text-foreground">Add something you are learning</p><p className="mt-1 text-xs">Keep your current learning priorities visible.</p></div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionHeading
          title="Completed learning"
          description="Completed courses, certifications, and books together in one list."
        />
        <MotionList className="panel divide-y overflow-hidden rounded-[22px]">
          {completedItems.length ? completedItems.map((item) => {
            const category = categories.find((entry) => entry.name === item.category) ?? categories[0];
            const Icon = category.icon;
            return (
              <article key={item.id} className="task-row task-row-completed flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="task-title truncate text-sm font-semibold line-through">{item.title}</h2>
                  <p className="muted mt-1 truncate text-xs">{[item.category, item.provider].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="muted w-fit rounded-full border px-2.5 py-1 text-xs">{item.category}</span>
                <div className="flex items-center gap-2">
                  {item.resourceUrl && (
                    <a
                      href={item.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${item.title}`}
                      className="muted grid size-10 place-items-center rounded-xl border transition hover:bg-foreground/5 hover:text-foreground"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                  <button
                    onClick={() => openEditForm(item)}
                    aria-label={`Edit ${item.title}`}
                    className="muted grid size-10 place-items-center rounded-xl border transition hover:bg-foreground/5 hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setDeletingItem(item)}
                    aria-label={`Delete ${item.title}`}
                    className="muted grid size-10 place-items-center rounded-xl border transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <button
                    onClick={() => toggleComplete(item.id)}
                    aria-label={`Mark ${item.title} incomplete`}
                    className="grid size-10 place-items-center rounded-xl border bg-foreground text-background transition"
                  >
                    <Check className="task-check-icon size-4" />
                  </button>
                </div>
              </article>
            );
          }) : <p className="muted p-6 text-sm">Completed learning will appear here.</p>}
        </MotionList>
      </section>

      <Modal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
        title={editingId ? "Edit learning" : "Add learning"}
        description={editingId
          ? "Update the details for this learning item."
          : "Add a course, certification, or book to your personal library."}
      >
        <form className="grid gap-4" onSubmit={saveLearning}>
          <Field label="Title">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
              placeholder="Advanced TypeScript"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <SelectControl
                value={category}
                onValueChange={(value) => setCategory(value as LearningItem["category"])}
                options={["Course", "Certification", "Book"]}
              />
            </Field>
            <Field label="Status">
              <SelectControl
                value={status}
                onValueChange={(value) => setStatus(value as LearningItem["status"])}
                options={["To learn", "In progress", "Completed"]}
              />
            </Field>
          </div>
          <Field label="Provider or author">
            <input
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              className={inputClass}
              placeholder="Provider, institution, or author"
            />
          </Field>
          <Field label="Resource URL (optional)">
            <input
              type="url"
              value={resourceUrl}
              onChange={(event) => setResourceUrl(event.target.value)}
              className={inputClass}
              placeholder="https://…"
            />
          </Field>
          <Button type="submit">
            {editingId ? <Check className="size-4" /> : <Plus className="size-4" />}
            {editingId ? "Save changes" : "Add to learning"}
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Delete this learning item?"
        description={deletingItem?.title || ""}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeletingItem(null)}>Cancel</Button>
          <Button variant="danger" onClick={deleteLearning}><Trash2 className="size-4" /> Delete learning</Button>
        </div>
      </Modal>
    </>
  );
}
