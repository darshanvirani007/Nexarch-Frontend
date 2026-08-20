"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { BriefcaseBusiness, CalendarCheck2, Check, ExternalLink, ListTodo, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/components/app-store";
import { Button, Field, inputClass, Modal, SelectControl } from "@/components/ui";
import type { JobApplication, Task } from "@/lib/types";

type TaskTab = "Daily tasks" | "Tasks" | "Job applications";

const applicationStatusStyles: Record<JobApplication["status"], string> = {
  Pending: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Applied: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Accepted: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Rejected: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export default function TasksPage() {
  const searchParams = useSearchParams();
  const { tasks, setTasks, jobApplications, setJobApplications } = useAppStore();
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [title, setTitle] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TaskTab>(requestedTab === "general" ? "Tasks" : requestedTab === "jobs" ? "Job applications" : "Daily tasks");
  const today = new Date();
  const dailyTasks = tasks.filter((task) => task.area === "Daily");
  const generalTasks = tasks.filter((task) => task.area !== "Daily" && task.area !== "Commerce");
  const visibleTasks = activeTab === "Daily tasks" ? dailyTasks : generalTasks;
  const toggle = (id: string) => {
    const completed = tasks.find((item) => item.id === id)?.status !== "Completed";
    setTasks((items) => items.map((item) => item.id === id ? { ...item, status: completed ? "Completed" : "Planned" } : item));
    toast.success(completed ? "Task completed" : "Task reopened");
  };
  const remove = (id: string) => {
    setTasks((items) => items.filter((item) => item.id !== id));
    toast.success(activeTab === "Daily tasks" ? "Daily task deleted" : "Task deleted");
  };
  const openTaskEditor = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setOpen(true);
  };
  const updateApplicationStatus = (id: string, status: JobApplication["status"]) => {
    setJobApplications((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    toast.success(`Application marked ${status.toLowerCase()}`);
  };
  const openApplicationEditor = (application: JobApplication) => {
    setEditingTask(null);
    setEditingApplication(application);
    setTitle(application.jobName);
    setJobUrl(application.jobUrl);
    setOpen(true);
  };
  const removeApplication = (id: string) => {
    setJobApplications((items) => items.filter((item) => item.id !== id));
    toast.success("Job application deleted");
  };

  const actionLabel = activeTab === "Daily tasks" ? "Add daily task" : activeTab === "Tasks" ? "Add task" : "Add job application";

  return (
    <>
      <PageHeader
        eyebrow={format(today, "EEEE, d MMMM")}
        title="Tasks"
        description="Turn important updates and ideas into clear next actions."
        action={<Button onClick={() => { setEditingTask(null); setEditingApplication(null); setTitle(""); setJobUrl(""); setOpen(true); }}><Plus className="size-4" /> {actionLabel}</Button>}
      />

      <div className="scrollbar-none mb-8 flex gap-1 overflow-x-auto rounded-2xl border bg-foreground/[.025] p-1.5" role="tablist" aria-label="Task types">
        {(["Daily tasks", "Tasks", "Job applications"] as const).map((tab) => {
          const active = activeTab === tab;
          const Icon = tab === "Daily tasks" ? CalendarCheck2 : tab === "Tasks" ? ListTodo : BriefcaseBusiness;
          const count = tab === "Daily tasks" ? dailyTasks.length : tab === "Tasks" ? generalTasks.length : jobApplications.length;
          const tabId = tab === "Daily tasks" ? "daily" : tab === "Tasks" ? "general" : "jobs";
          return <button
            key={tab}
            id={`tasks-tab-${tabId}`}
            role="tab"
            aria-selected={active}
            aria-controls={`tasks-panel-${tabId}`}
            onClick={() => setActiveTab(tab)}
            className={`flex min-w-fit flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${active ? "bg-foreground text-background shadow-sm" : "muted hover:bg-foreground/5 hover:text-foreground"}`}
          >
            <Icon className="size-4" />
            {tab}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-background/15" : "bg-foreground/5"}`}>{count}</span>
          </button>;
        })}
      </div>

      {activeTab !== "Job applications" ? <div
        id={`tasks-panel-${activeTab === "Daily tasks" ? "daily" : "general"}`}
        role="tabpanel"
        aria-labelledby={`tasks-tab-${activeTab === "Daily tasks" ? "daily" : "general"}`}
        className="panel divide-y overflow-hidden rounded-[22px]"
      >
        {visibleTasks.length ? visibleTasks.map((task) => (
          <div key={task.id} className={`task-row flex items-center gap-3 p-4 ${task.status === "Completed" ? "task-row-completed" : ""}`}>
            <button
              onClick={() => toggle(task.id)}
              aria-label={task.status === "Completed" ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
              className={`grid size-6 shrink-0 place-items-center rounded-lg border ${task.status === "Completed" ? "bg-foreground text-background" : ""}`}
            >
              {task.status === "Completed" && <Check className="task-check-icon size-3.5" />}
            </button>
            <p className={`task-title min-w-0 flex-1 text-sm font-medium ${task.status === "Completed" ? "muted line-through" : ""}`}>{task.title}</p>
            <button onClick={() => openTaskEditor(task)} className="muted rounded-lg p-2 transition hover:bg-foreground/5 hover:text-foreground" aria-label={`Edit ${task.title}`}>
              <Pencil className="size-4" />
            </button>
            <button onClick={() => remove(task.id)} className="muted rounded-lg p-2 transition hover:bg-red-500/10 hover:text-red-500" aria-label={`Delete ${task.title}`}>
              <Trash2 className="size-4" />
            </button>
          </div>
        )) : <div className="p-8 text-center"><p className="text-sm font-medium">{activeTab === "Daily tasks" ? "No daily tasks yet" : "Nothing needs action right now"}</p><p className="muted mt-1 text-xs">{activeTab === "Daily tasks" ? "Add a focused task for your day." : "Add a task you want to keep track of."}</p></div>}
      </div> : <div id="tasks-panel-jobs" role="tabpanel" aria-labelledby="tasks-tab-jobs" className="panel divide-y overflow-hidden rounded-[22px]">
        {jobApplications.length ? jobApplications.map((application) => <article key={application.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border"><BriefcaseBusiness className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">{application.jobName}</h2>
            <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="muted mt-1 block truncate text-xs transition hover:text-foreground">{application.jobUrl}</a>
          </div>
          <div className="flex items-center gap-2">
            <SelectControl id={`job-status-${application.id}`} ariaLabel={`Status for ${application.jobName}`} value={application.status} onValueChange={(value) => updateApplicationStatus(application.id, value as JobApplication["status"])} options={["Pending", "Applied", "Accepted", "Rejected"]} className={`h-9 w-auto min-w-28 rounded-xl text-xs font-medium ${applicationStatusStyles[application.status]}`} />
            <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${application.jobName}`} className="muted rounded-lg p-2 transition hover:bg-foreground/5 hover:text-foreground"><ExternalLink className="size-4" /></a>
            <button onClick={() => openApplicationEditor(application)} className="muted rounded-lg p-2 transition hover:bg-foreground/5 hover:text-foreground" aria-label={`Edit ${application.jobName}`}><Pencil className="size-4" /></button>
            <button onClick={() => removeApplication(application.id)} className="muted rounded-lg p-2 transition hover:bg-red-500/10 hover:text-red-500" aria-label={`Delete ${application.jobName}`}><Trash2 className="size-4" /></button>
          </div>
        </article>) : <div className="p-8 text-center"><p className="text-sm font-medium">No job applications yet</p><p className="muted mt-1 text-xs">Add a role and its job listing link to start tracking it.</p></div>}
      </div>}
      <Modal open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) { setEditingTask(null); setEditingApplication(null); setTitle(""); setJobUrl(""); } }} title={editingTask ? "Edit task" : editingApplication ? "Edit job application" : activeTab === "Daily tasks" ? "Add today’s task" : activeTab === "Tasks" ? "Add task" : "Add job application"} description={editingTask ? "Update the task name without changing its completion state." : editingApplication ? "Update the role name and job listing link without changing its status." : activeTab === "Daily tasks" ? "Keep it short and focused." : activeTab === "Tasks" ? "Add something you want to keep track of." : "Save the role and listing link. New applications start as pending."}>
        <form className="grid gap-4" onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return toast.error(activeTab === "Job applications" ? "Job name is required" : "Task name is required");
          if (editingTask) {
            setTasks((items) => items.map((item) => item.id === editingTask.id ? { ...item, title: title.trim() } : item));
            toast.success("Task updated");
            setEditingTask(null);
            setTitle("");
            setOpen(false);
            return;
          }
          if (activeTab === "Job applications") {
            let cleanJobUrl: string;
            try {
              const parsedUrl = new URL(jobUrl.trim());
              if (!/^https?:$/.test(parsedUrl.protocol)) throw new Error("Unsupported protocol");
              cleanJobUrl = parsedUrl.toString();
            } catch {
              return toast.error("Enter a valid job link beginning with http:// or https://");
            }
            if (editingApplication) {
              setJobApplications((items) => items.map((item) => item.id === editingApplication.id
                ? { ...item, jobName: title.trim(), jobUrl: cleanJobUrl }
                : item));
              toast.success("Job application updated");
              setEditingApplication(null);
              setTitle("");
              setJobUrl("");
              setOpen(false);
              return;
            }
            setJobApplications((items) => [{ id: crypto.randomUUID(), jobName: title.trim(), jobUrl: cleanJobUrl, status: "Pending", createdAt: new Date().toISOString() }, ...items]);
            toast.success("Job application added as pending");
            setTitle("");
            setJobUrl("");
            setOpen(false);
            return;
          }
          setTasks((items) => [{
            id: crypto.randomUUID(),
            title: title.trim(),
            area: activeTab === "Daily tasks" ? "Daily" : "General",
            status: "Planned",
            priority: "Medium",
            dueDate: new Date().toISOString(),
            estimatedMinutes: 0,
            tags: [],
          }, ...items]);
          toast.success(activeTab === "Daily tasks" ? "Task added for today" : "Task added");
          setTitle("");
          setOpen(false);
        }}>
          <Field label={activeTab === "Job applications" ? "Job name" : "Task"}>
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder={activeTab === "Daily tasks" ? "What needs doing today?" : activeTab === "Tasks" ? "What needs doing?" : "Product Designer at Nexarch"} required autoFocus />
          </Field>
          {activeTab === "Job applications" && <Field label="Job link"><input type="url" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} className={inputClass} placeholder="https://company.com/jobs/role" required /></Field>}
          <Button type="submit">{editingTask || editingApplication ? "Save changes" : actionLabel}</Button>
        </form>
      </Modal>
    </>
  );
}
