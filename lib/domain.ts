import type { Task } from "./types";

export function filterTasks(tasks: Task[], filter: "Today" | "Upcoming" | "Inbox" | "Completed", now = new Date()) {
  return tasks.filter((task) => {
    if (filter === "Completed") return task.status === "Completed";
    if (filter === "Inbox") return task.status === "Inbox";
    const due = new Date(task.dueDate);
    if (filter === "Upcoming") return due > now && due.toDateString() !== now.toDateString();
    return due.toDateString() === now.toDateString() && task.status !== "Completed";
  });
}

export function websiteStatusFromResponse(statusCode: number, responseTimeMs: number) {
  if (statusCode >= 500) return "offline" as const;
  if (statusCode >= 400 || responseTimeMs > 2500) return "degraded" as const;
  return "online" as const;
}

export function ownsRecord(recordUserId: string, authenticatedUserId: string | null) {
  return Boolean(authenticatedUserId && recordUserId === authenticatedUserId);
}
