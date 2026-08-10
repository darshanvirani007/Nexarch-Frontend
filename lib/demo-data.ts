import type { Business, Goal, LearningItem, Task } from "./types";

export const demoBusinesses: Business[] = [
  {
    id: "northstar", name: "Northstar Studio", slug: "northstar-studio",
    description: "Digital product and brand studio for ambitious companies.",
    websiteUrl: "https://example.com/?demo=northstar", websiteStatus: "online",
    httpStatusCode: 200, responseTimeMs: 184, lastCheckedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
    emailProvider: "Google Workspace", emailInboxUrl: "https://mail.google.com/?demo=northstar",
    adminUrl: "https://example.com/admin?demo=northstar", hostingUrl: "https://vercel.com/?demo=northstar",
    domainUrl: "https://dash.cloudflare.com/?demo=northstar", analyticsUrl: "https://analytics.google.com/?demo=northstar",
    notes: "", isActive: true, displayOrder: 0,
    socials: [
      { id: "n1", platform: "LinkedIn", accountName: "Northstar Studio", username: "northstar-demo", profileUrl: "https://linkedin.com/?demo=northstar" },
      { id: "n2", platform: "Instagram", accountName: "Northstar Studio", username: "@northstar.demo", profileUrl: "https://instagram.com/?demo=northstar" },
      { id: "n3", platform: "X", accountName: "Northstar Studio", username: "@northstar_demo", profileUrl: "https://x.com/?demo=northstar" },
    ],
    links: [{ id: "nl1", label: "GitHub repository", category: "Development", url: "https://github.com/?demo=northstar" }],
  },
  {
    id: "blackbird", name: "Blackbird Systems", slug: "blackbird-systems",
    description: "Automation and intelligent systems for modern operations.",
    websiteUrl: "https://example.com/?demo=blackbird", websiteStatus: "degraded",
    httpStatusCode: 206, responseTimeMs: 942, lastCheckedAt: new Date(Date.now() - 22 * 60_000).toISOString(),
    emailProvider: "Microsoft 365", emailInboxUrl: "https://outlook.office.com/mail/?demo=blackbird",
    adminUrl: "https://example.com/admin?demo=blackbird", hostingUrl: "https://vercel.com/?demo=blackbird",
    domainUrl: "https://dash.cloudflare.com/?demo=blackbird", notes: "", isActive: true, displayOrder: 1,
    socials: [
      { id: "b1", platform: "LinkedIn", accountName: "Blackbird Systems", username: "blackbird-demo", profileUrl: "https://linkedin.com/?demo=blackbird" },
      { id: "b2", platform: "YouTube", accountName: "Blackbird Systems", username: "@blackbird.demo", profileUrl: "https://youtube.com/?demo=blackbird" },
      { id: "b3", platform: "GitHub", accountName: "Blackbird Systems", username: "blackbird-demo", profileUrl: "https://github.com/?demo=blackbird" },
    ],
    links: [{ id: "bl1", label: "Supabase", category: "Development", url: "https://supabase.com/dashboard?demo=blackbird" }],
  },
  {
    id: "fieldnotes", name: "Fieldnotes Press", slug: "fieldnotes-press",
    description: "Independent publishing for ideas worth keeping.",
    websiteUrl: "https://example.com/?demo=fieldnotes", websiteStatus: "online",
    httpStatusCode: 200, responseTimeMs: 251, lastCheckedAt: new Date(Date.now() - 41 * 60_000).toISOString(),
    emailProvider: "Zoho Mail", emailInboxUrl: "https://mail.zoho.com/?demo=fieldnotes",
    adminUrl: "https://example.com/admin?demo=fieldnotes", hostingUrl: "https://vercel.com/?demo=fieldnotes",
    domainUrl: "https://www.namecheap.com/?demo=fieldnotes", notes: "", isActive: true, displayOrder: 2,
    socials: [
      { id: "f1", platform: "Instagram", accountName: "Fieldnotes Press", username: "@fieldnotes.demo", profileUrl: "https://instagram.com/?demo=fieldnotes" },
      { id: "f2", platform: "Threads", accountName: "Fieldnotes Press", username: "@fieldnotes.demo", profileUrl: "https://threads.net/?demo=fieldnotes" },
      { id: "f3", platform: "Facebook", accountName: "Fieldnotes Press", username: "fieldnotes.demo", profileUrl: "https://facebook.com/?demo=fieldnotes" },
    ],
    links: [{ id: "fl1", label: "Notion workspace", category: "Documents", url: "https://notion.so/?demo=fieldnotes" }],
  },
];

export const demoTasks: Task[] = [
  { id: "t1", title: "Review website copy", area: "Northstar Studio", status: "In progress", priority: "High", dueDate: new Date().toISOString(), estimatedMinutes: 45, tags: ["website"] },
  { id: "t2", title: "Complete TypeScript module", area: "Learning", status: "Planned", priority: "Medium", dueDate: new Date().toISOString(), estimatedMinutes: 60, tags: ["study"] },
  { id: "t3", title: "Organise launch notes", area: "Fieldnotes Press", status: "Completed", priority: "Low", dueDate: new Date().toISOString(), estimatedMinutes: 30, tags: ["notes"] },
  { id: "t4", title: "Renew domain settings", area: "Blackbird Systems", status: "Planned", priority: "High", dueDate: new Date().toISOString(), estimatedMinutes: 20, tags: ["domain"] },
];

export const demoGoals: Goal[] = [
  { id: "g1", title: "Earn €15,000 this year through business", category: "Business", currentValue: 4500, targetValue: 15000, unit: "€", status: "On track", deadline: "2026-12-31" },
  { id: "g2", title: "Sign 10 professional clients", category: "Professional", currentValue: 3, targetValue: 10, unit: "clients", status: "On track", deadline: "2026-12-31" },
  { id: "g3", title: "Build a €12,000 savings reserve", category: "Financial", currentValue: 5000, targetValue: 12000, unit: "€", status: "At risk", deadline: "2026-12-31" },
];

export const demoLearning: LearningItem[] = [
  { id: "l1", title: "Advanced TypeScript", category: "Course", provider: "Frontend Masters", status: "In progress", resourceUrl: "https://example.com/?demo=typescript-course" },
  { id: "l2", title: "Designing Interfaces", category: "Book", provider: "O’Reilly", status: "In progress", resourceUrl: "https://example.com/?demo=design-book" },
  { id: "l3", title: "AWS Solutions Architect", category: "Certification", provider: "Amazon Web Services", status: "To learn", resourceUrl: "https://example.com/?demo=aws-certification" },
];

export const demoActivities = [
  { id: "a1", label: "Task completed", detail: "Organise launch notes", at: "18 min ago" },
  { id: "a2", label: "Website status changed", detail: "Blackbird Systems is degraded", at: "22 min ago" },
  { id: "a3", label: "Learning session completed", detail: "Advanced TypeScript · 55 minutes", at: "Yesterday" },
];
