export type WebsiteStatus = "online" | "offline" | "degraded" | "unknown" | "checking";

export type SocialAccount = {
  id: string;
  platform: "LinkedIn" | "Instagram" | "X" | "YouTube" | "Facebook" | "TikTok" | "GitHub" | "Threads" | "Reddit" | "Blog" | "Other";
  accountName: string;
  username: string;
  profileUrl: string;
  showOnCard?: boolean;
};

export type BusinessLink = {
  id: string;
  label: string;
  url: string;
  category: "Website" | "Development" | "Hosting" | "Domain" | "Email" | "Social" | "Analytics" | "Payments" | "Documents" | "Other";
  showOnCard?: boolean;
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  websiteUrl: string;
  websiteStatus: WebsiteStatus;
  httpStatusCode?: number;
  responseTimeMs?: number;
  lastCheckedAt?: string;
  emailProvider: string;
  emailInboxUrl: string;
  adminUrl: string;
  hostingUrl: string;
  domainUrl: string;
  analyticsUrl?: string;
  notes: string;
  isActive: boolean;
  displayOrder: number;
  primaryLinkIds?: Partial<Record<"website" | "email" | "admin" | "hosting" | "domain" | "analytics", string>>;
  cardShortcutVisibility?: Partial<Record<"website" | "email" | "admin" | "hosting" | "domain", boolean>>;
  socials: SocialAccount[];
  links: BusinessLink[];
};

export type Task = {
  id: string; title: string; area: string; status: "Inbox" | "Planned" | "In progress" | "Blocked" | "Completed" | "Cancelled";
  priority: "Low" | "Medium" | "High"; dueDate: string; estimatedMinutes: number; tags: string[];
};

export type JobApplication = {
  id: string;
  jobName: string;
  jobUrl: string;
  status: "Pending" | "Applied" | "Accepted" | "Rejected";
  createdAt: string;
};

export type Goal = {
  id: string; title: string; category: string; currentValue: number; targetValue: number;
  unit: string; status: "Not started" | "On track" | "At risk" | "Behind" | "Completed" | "Paused"; deadline: string;
};

export type LearningItem = {
  id: string;
  title: string;
  category: "Course" | "Certification" | "Book";
  provider: string;
  status: "To learn" | "In progress" | "Completed";
  resourceUrl: string;
};

export const personalLinkKinds = [
  "Freelance account", "Upwork", "Fiverr", "Email inbox", "Blog", "YouTube",
  "GitHub", "Supabase", "Vercel", "LinkedIn", "Reddit", "LeetCode",
  "GPT / ChatGPT", "Udemy", "Project Euler", "Everyday website", "Other",
] as const;

export type PersonalLinkKind = typeof personalLinkKinds[number];
export type PersonalLinkCategory = "Work" | "Email" | "Blog" | "YouTube" | "Development" | "Social" | "Others";

export type PersonalLink = {
  id: string;
  name: string;
  kind: PersonalLinkKind;
  category: PersonalLinkCategory;
  url: string;
  createdAt: string;
};
