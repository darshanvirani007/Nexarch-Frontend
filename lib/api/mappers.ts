import type {
  Business, BusinessLink, Goal, JobApplication, LearningItem, PersonalLink,
  PersonalLinkCategory, PersonalLinkKind, SocialAccount, Task, WebsiteStatus,
} from "@/lib/types";

export type ProfileResponse = {
  profile: { id: string; full_name: string | null; country: string | null; contact_no: string | null; timezone: string | null } | null;
  email: string | null;
};

export type BusinessLinkRow = {
  id: string; business_id: string; link_type: string; name: string; url: string;
  show_on_card: boolean; display_order: number; is_active: boolean;
};

export type SocialRow = {
  id: string; business_id: string; platform: string; username: string | null; url: string;
  show_on_card?: boolean; display_order: number; is_active: boolean;
};

export type WebsiteCheckRow = {
  id: string; business_id: string; status: string; http_status_code: number | null;
  response_time_ms: number | null; error_message: string | null; checked_at: string;
};

export type BusinessRow = {
  id: string; name: string; description: string | null; is_archived: boolean; display_order: number;
  links?: BusinessLinkRow[]; social_links?: SocialRow[];
  note?: { id: string; content: string | null } | null; website_checks?: WebsiteCheckRow[];
};

export type MyLinkRow = {
  id: string; link_type: string; category: string; name: string; url: string;
  display_order: number; is_active: boolean; created_at: string;
};

export type LearningRow = {
  id: string; title: string; category: string; status: string; provider_or_author: string | null;
  resource_url: string | null; display_order: number;
};

export type GoalRow = {
  id: string; title: string; category: string; measure: string; deadline: string | null;
  display_order: number; current_value: string | number; target_value: string | number; unit: string;
};

export type DailyTaskRow = {
  id: string; task: string; task_date: string; is_completed: boolean; display_order: number; created_at: string;
};

export type TaskRow = {
  id: string; task: string; is_completed: boolean; display_order: number; created_at: string;
};

export type JobApplicationRow = {
  id: string; job_name: string; job_link: string | null; status: string; display_order: number; created_at: string;
};

export type PersistedBusinessLink = {
  id?: string; link_type: string; name: string; url: string; show_on_card: boolean; display_order: number; is_active: boolean;
};

export function businessLinkRecords(business: Business): PersistedBusinessLink[] {
  const primary: Array<{ type: "website" | "email" | "admin" | "hosting" | "domain" | "analytics"; name: string; url: string; visible: boolean }> = [
    { type: "website", name: "Website link", url: business.websiteUrl, visible: business.cardShortcutVisibility?.website !== false },
    { type: "email", name: "Email inbox", url: business.emailInboxUrl, visible: business.cardShortcutVisibility?.email !== false },
    { type: "admin", name: "Admin panel", url: business.adminUrl, visible: business.cardShortcutVisibility?.admin !== false },
    { type: "hosting", name: "Hosting dashboard", url: business.hostingUrl, visible: business.cardShortcutVisibility?.hosting !== false },
    { type: "domain", name: "Domain dashboard", url: business.domainUrl, visible: business.cardShortcutVisibility?.domain !== false },
    { type: "analytics", name: "Analytics dashboard", url: business.analyticsUrl ?? "", visible: true },
  ];
  const primaryRows = primary.filter((link) => link.url.trim()).map((link, index) => ({
    id: business.primaryLinkIds?.[link.type], link_type: link.type, name: link.name, url: link.url.trim(),
    show_on_card: link.visible, display_order: index, is_active: true,
  }));
  const customRows = business.links.filter((link) => link.url.trim()).map((link, index) => ({
    id: link.id, link_type: `custom:${link.category.toLowerCase()}`, name: link.label, url: link.url.trim(),
    show_on_card: link.showOnCard !== false, display_order: primaryRows.length + index, is_active: true,
  }));
  return [...primaryRows, ...customRows];
}

export function businessSocialRecord(social: SocialAccount, displayOrder: number) {
  return {
    platform: social.platform.toLowerCase(),
    username: social.username || null,
    url: social.profileUrl.trim(),
    show_on_card: social.showOnCard !== false,
    display_order: displayOrder,
    is_active: true,
  };
}

type PrimaryLinkType = "website" | "email" | "admin" | "hosting" | "domain" | "analytics";

function primaryLinkType(value: string): PrimaryLinkType | null {
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, "_");
  if (normalized.includes("website")) return "website";
  if (normalized.includes("email") || normalized.includes("inbox")) return "email";
  if (normalized.includes("admin")) return "admin";
  if (normalized.includes("hosting")) return "hosting";
  if (normalized.includes("domain")) return "domain";
  if (normalized.includes("analytics")) return "analytics";
  return null;
}

function businessLinkCategory(type: string, name: string): BusinessLink["category"] {
  const value = `${type} ${name}`.toLowerCase();
  if (value.includes("github") || value.includes("repository") || value.includes("development")) return "Development";
  if (value.includes("hosting") || value.includes("vercel") || value.includes("cloudflare")) return "Hosting";
  if (value.includes("domain") || value.includes("registrar")) return "Domain";
  if (value.includes("email") || value.includes("inbox")) return "Email";
  if (value.includes("social") || value.includes("business suite")) return "Social";
  if (value.includes("analytics") || value.includes("search console")) return "Analytics";
  if (value.includes("payment") || value.includes("stripe")) return "Payments";
  if (value.includes("document") || value.includes("notion")) return "Documents";
  if (value.includes("website")) return "Website";
  return "Other";
}

const socialPlatforms: SocialAccount["platform"][] = [
  "LinkedIn", "Instagram", "X", "YouTube", "Facebook", "TikTok", "GitHub", "Threads", "Reddit", "Blog", "Other",
];

function socialPlatform(value: string): SocialAccount["platform"] {
  return socialPlatforms.find((platform) => platform.toLowerCase() === value.toLowerCase()) ?? "Other";
}

export function mapBusiness(row: BusinessRow): Business {
  const activeLinks = (row.links ?? []).filter((link) => link.is_active);
  const primary = new Map<PrimaryLinkType, BusinessLinkRow>();
  const customLinks: BusinessLink[] = [];
  for (const link of activeLinks) {
    const primaryType = link.link_type.startsWith("custom:") ? null : primaryLinkType(link.link_type);
    if (primaryType && !primary.has(primaryType)) primary.set(primaryType, link);
    else customLinks.push({
      id: link.id,
      label: link.name,
      url: link.url,
      category: businessLinkCategory(link.link_type, link.name),
      showOnCard: link.show_on_card,
    });
  }
  const latestCheck = row.website_checks?.[0];
  const status: WebsiteStatus = latestCheck && ["online", "offline", "degraded"].includes(latestCheck.status)
    ? latestCheck.status as WebsiteStatus
    : "unknown";
  const url = (type: PrimaryLinkType) => primary.get(type)?.url ?? "";
  const visible = (type: PrimaryLinkType) => primary.get(type)?.show_on_card ?? true;
  return {
    id: row.id,
    name: row.name,
    slug: row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    description: row.description ?? "",
    websiteUrl: url("website"),
    websiteStatus: status,
    httpStatusCode: latestCheck?.http_status_code ?? undefined,
    responseTimeMs: latestCheck?.response_time_ms ?? undefined,
    lastCheckedAt: latestCheck?.checked_at,
    emailProvider: "Custom",
    emailInboxUrl: url("email"),
    adminUrl: url("admin"),
    hostingUrl: url("hosting"),
    domainUrl: url("domain"),
    analyticsUrl: url("analytics"),
    notes: row.note?.content ?? "",
    isActive: !row.is_archived,
    displayOrder: row.display_order,
    primaryLinkIds: Object.fromEntries([...primary.entries()].map(([type, link]) => [type, link.id])),
    cardShortcutVisibility: {
      website: visible("website"), email: visible("email"), admin: visible("admin"),
      hosting: visible("hosting"), domain: visible("domain"),
    },
    links: customLinks,
    socials: (row.social_links ?? []).filter((item) => item.is_active).map((item) => ({
      id: item.id,
      platform: socialPlatform(item.platform),
      accountName: row.name,
      username: item.username ?? "",
      profileUrl: item.url,
      showOnCard: item.show_on_card !== false,
    })),
  };
}

const personalCategories: Record<string, PersonalLinkCategory> = {
  work: "Work", email: "Email", blog: "Blog", youtube: "YouTube",
  development: "Development", social: "Social", other: "Others", others: "Others",
};

const personalKinds: Record<string, PersonalLinkKind> = {
  "freelance account": "Freelance account",
  upwork: "Upwork",
  fiverr: "Fiverr",
  email: "Email inbox",
  "email inbox": "Email inbox",
  blog: "Blog",
  youtube: "YouTube",
  github: "GitHub",
  supabase: "Supabase",
  vercel: "Vercel",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  leetcode: "LeetCode",
  gpt: "GPT / ChatGPT",
  chatgpt: "GPT / ChatGPT",
  "gpt / chatgpt": "GPT / ChatGPT",
  udemy: "Udemy",
  "project euler": "Project Euler",
  "everyday website": "Everyday website",
  other: "Other",
};

function personalKind(value: string): PersonalLinkKind {
  const normalised = value.trim().toLowerCase().replace(/[_-]+/g, " ");
  return personalKinds[normalised] ?? "Other";
}

export function mapPersonalLink(row: MyLinkRow): PersonalLink {
  return {
    id: row.id,
    name: row.name,
    kind: personalKind(row.link_type),
    category: personalCategories[row.category.toLowerCase()] ?? "Others",
    url: row.url,
    createdAt: row.created_at,
  };
}

export function mapLearning(row: LearningRow): LearningItem {
  const category = row.category.toLowerCase();
  const status = row.status.toLowerCase();
  return {
    id: row.id,
    title: row.title,
    category: category === "certification" ? "Certification" : category === "book" ? "Book" : "Course",
    provider: row.provider_or_author ?? "",
    status: status === "completed" ? "Completed" : status === "in_progress" ? "In progress" : "To learn",
    resourceUrl: row.resource_url ?? "",
  };
}

const goalUnits: Record<string, string> = {
  "€": "Euro",
  euro: "Euro",
  clients: "Clients",
  projects: "Projects",
  sales: "Sales",
  hours: "Hours",
  items: "Items",
};

function goalUnit(value: string): string {
  return goalUnits[value.trim().toLowerCase()] ?? value;
}

export function mapGoal(row: GoalRow): Goal {
  const currentValue = Number(row.current_value);
  const targetValue = Number(row.target_value);
  const categories: Record<string, string> = {
    financial: "Financial",
    professional: "Professional",
    business: "Business",
  };
  return {
    id: row.id,
    title: row.title,
    category: categories[row.category.toLowerCase()] ?? row.category,
    currentValue,
    targetValue,
    unit: goalUnit(row.unit || row.measure),
    status: currentValue >= targetValue ? "Completed" : currentValue > 0 ? "On track" : "Not started",
    deadline: row.deadline ?? "",
  };
}

export function mapDailyTask(row: DailyTaskRow): Task {
  return {
    id: row.id, title: row.task, area: "Daily", status: row.is_completed ? "Completed" : "Planned",
    priority: "Medium", dueDate: row.task_date, estimatedMinutes: 0, tags: [],
  };
}

export function mapTask(row: TaskRow): Task {
  return {
    id: row.id, title: row.task, area: "General", status: row.is_completed ? "Completed" : "Planned",
    priority: "Medium", dueDate: row.created_at, estimatedMinutes: 0, tags: [],
  };
}

export function mapJobApplication(row: JobApplicationRow): JobApplication {
  const statuses: Record<string, JobApplication["status"]> = {
    pending: "Pending", applied: "Applied", accepted: "Accepted", rejected: "Rejected",
    interested: "Pending", interview: "Applied", offer: "Accepted", withdrawn: "Rejected",
  };
  return {
    id: row.id,
    jobName: row.job_name,
    jobUrl: row.job_link ?? "",
    status: statuses[row.status.toLowerCase()] ?? "Pending",
    createdAt: row.created_at,
  };
}

export type SyncedRecord = { resource: string; payload: Record<string, unknown> };

export function personalLinkRecord(link: PersonalLink, displayOrder: number): SyncedRecord {
  const categories: Record<PersonalLinkCategory, string> = {
    Work: "work", Email: "email", Blog: "blog", YouTube: "youtube",
    Development: "development", Social: "social", Others: "other",
  };
  return { resource: "links", payload: { link_type: link.kind, category: categories[link.category], name: link.name, url: link.url, display_order: displayOrder, is_active: true } };
}

export function learningRecord(item: LearningItem, displayOrder: number): SyncedRecord {
  const statuses: Record<LearningItem["status"], string> = { "To learn": "to_learn", "In progress": "in_progress", Completed: "completed" };
  return { resource: "learning", payload: { title: item.title, category: item.category.toLowerCase(), status: statuses[item.status], provider_or_author: item.provider || null, resource_url: item.resourceUrl || null, display_order: displayOrder } };
}

export function goalRecord(goal: Goal, displayOrder: number): SyncedRecord {
  const unit = goalUnit(goal.unit);
  return { resource: "goals", payload: { title: goal.title, category: goal.category.toLowerCase(), measure: unit.toLowerCase(), deadline: goal.deadline || null, display_order: displayOrder, current_value: goal.currentValue, target_value: goal.targetValue, unit } };
}

export function taskRecord(task: Task, displayOrder: number): SyncedRecord | null {
  if (task.area === "Commerce") return null;
  if (task.area === "Daily") return { resource: "daily-tasks", payload: { task: task.title, task_date: task.dueDate.slice(0, 10), is_completed: task.status === "Completed", display_order: displayOrder } };
  return { resource: "tasks", payload: { task: task.title, is_completed: task.status === "Completed", display_order: displayOrder } };
}

export function jobApplicationRecord(item: JobApplication, displayOrder: number): SyncedRecord {
  const statuses: Record<JobApplication["status"], string> = { Pending: "pending", Applied: "applied", Accepted: "accepted", Rejected: "rejected" };
  return { resource: "job-applications", payload: { job_name: item.jobName, job_link: item.jobUrl || null, status: statuses[item.status], display_order: displayOrder } };
}

export function mapSyncedRecord<T>(resource: string, row: unknown): T {
  if (resource === "links") return mapPersonalLink(row as MyLinkRow) as T;
  if (resource === "learning") return mapLearning(row as LearningRow) as T;
  if (resource === "goals") return mapGoal(row as GoalRow) as T;
  if (resource === "daily-tasks") return mapDailyTask(row as DailyTaskRow) as T;
  if (resource === "tasks") return mapTask(row as TaskRow) as T;
  if (resource === "job-applications") return mapJobApplication(row as JobApplicationRow) as T;
  return row as T;
}
