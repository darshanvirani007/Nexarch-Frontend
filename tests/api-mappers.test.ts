import { describe, expect, it } from "vitest";
import {
  businessSocialRecord, goalRecord, jobApplicationRecord, learningRecord, mapBusiness, mapGoal, mapJobApplication,
  mapLearning, mapPersonalLink, preservePendingSocialVisibility, taskRecord, type BusinessRow,
} from "../lib/api/mappers";
import type { Business, Goal, JobApplication, LearningItem, Task } from "../lib/types";

describe("Laravel API mappings", () => {
  it("maps an owned business workspace and its shortcuts", () => {
    const row: BusinessRow = {
      id: "business-1",
      name: "Nexarch Studio",
      description: "Product studio",
      is_archived: false,
      display_order: 0,
      links: [
        { id: "website-1", business_id: "business-1", link_type: "website", name: "Website link", url: "https://example.com", show_on_card: true, display_order: 0, is_active: true },
        { id: "repo-1", business_id: "business-1", link_type: "custom:development", name: "GitHub repository", url: "https://github.com/example", show_on_card: false, display_order: 1, is_active: true },
      ],
      social_links: [
        { id: "social-1", business_id: "business-1", platform: "LinkedIn", username: "nexarch", url: "https://linkedin.com/company/nexarch", show_on_card: false, display_order: 0, is_active: true },
      ],
      note: { id: "note-1", content: "Private note" },
      website_checks: [
        { id: "check-1", business_id: "business-1", status: "online", http_status_code: 200, response_time_ms: 145, error_message: null, checked_at: "2026-08-09T20:00:00Z" },
      ],
    };

    const business = mapBusiness(row);
    expect(business.websiteUrl).toBe("https://example.com");
    expect(business.websiteStatus).toBe("online");
    expect(business.links[0]).toMatchObject({ id: "repo-1", category: "Development", showOnCard: false });
    expect(business.socials[0]).toMatchObject({ platform: "LinkedIn", showOnCard: false });
    expect(business.notes).toBe("Private note");
    expect(business.primaryLinkIds?.website).toBe("website-1");
  });

  it("normalises database values into the existing frontend labels", () => {
    expect(mapLearning({ id: "1", title: "Laravel", category: "course", status: "in_progress", provider_or_author: "Laracasts", resource_url: null, display_order: 0 }).status).toBe("In progress");
    expect(mapJobApplication({ id: "2", job_name: "Engineer", job_link: null, status: "accepted", display_order: 0, created_at: "2026-08-09" }).status).toBe("Accepted");
    expect(mapPersonalLink({ id: "3", link_type: "GitHub", category: "development", name: "GitHub", url: "https://github.com/example", display_order: 0, is_active: true, created_at: "2026-08-09" })).toMatchObject({ category: "Development", kind: "GitHub" });
    expect(mapPersonalLink({ id: "4", link_type: "youtube", category: "youtube", name: "Channel", url: "https://youtube.com/@example", display_order: 0, is_active: true, created_at: "2026-08-09" }).kind).toBe("YouTube");
    expect(mapPersonalLink({ id: "5", link_type: "blog", category: "blog", name: "Journal", url: "https://example.blogspot.com", display_order: 0, is_active: true, created_at: "2026-08-09" }).kind).toBe("Blog");
    expect(mapGoal({ id: "6", title: "Annual savings", category: "financial", measure: "€", deadline: null, display_order: 0, current_value: "100", target_value: "1000", unit: "€" }).category).toBe("Financial");
  });

  it("serialises frontend values to the backend contract", () => {
    const learning: LearningItem = { id: "1", title: "Laravel", category: "Course", provider: "Laracasts", status: "Completed", resourceUrl: "" };
    const job: JobApplication = { id: "2", jobName: "Engineer", jobUrl: "", status: "Accepted", createdAt: "2026-08-09" };
    const daily: Task = { id: "3", title: "Review API", area: "Daily", status: "Completed", priority: "Medium", dueDate: "2026-08-09T12:00:00Z", estimatedMinutes: 0, tags: [] };
    const commerce: Task = { ...daily, id: "4", area: "Commerce" };
    const goal: Goal = { id: "5", title: "Annual savings", category: "Financial", currentValue: 100, targetValue: 1000, unit: "€", status: "On track", deadline: "2026-12-31" };

    expect(learningRecord(learning, 0).payload.status).toBe("completed");
    expect(jobApplicationRecord(job, 0).payload.status).toBe("accepted");
    expect(taskRecord(daily, 0)).toMatchObject({ resource: "daily-tasks", payload: { task_date: "2026-08-09", is_completed: true } });
    expect(taskRecord(commerce, 0)).toBeNull();
    expect(businessSocialRecord({ id: "social", platform: "YouTube", accountName: "Nexarch", username: "nexarch", profileUrl: "https://youtube.com/@nexarch", showOnCard: false }, 0)).toMatchObject({ platform: "youtube", show_on_card: false, display_order: 0 });
    expect(goalRecord(goal, 0).payload).toMatchObject({ category: "financial", measure: "euro", unit: "Euro" });
  });

  it("normalises legacy booleans and preserves visibility when a refresh omits the field", () => {
    const row: BusinessRow = {
      id: "business-1",
      name: "Nexarch Studio",
      description: "Product studio",
      is_archived: false,
      display_order: 0,
      social_links: [
        { id: "social-false", business_id: "business-1", platform: "LinkedIn", username: null, url: "https://linkedin.com/company/nexarch", show_on_card: "false", display_order: 0, is_active: true },
        { id: "social-missing", business_id: "business-1", platform: "YouTube", username: null, url: "https://youtube.com/@nexarch", display_order: 1, is_active: true },
      ],
    };
    const refreshed = mapBusiness(row);
    const pending: Business = {
      ...refreshed,
      socials: refreshed.socials.map((social) => social.id === "social-missing" ? { ...social, showOnCard: false } : social),
    };
    const reconciled = preservePendingSocialVisibility(refreshed, pending);

    expect(reconciled.socials.find((social) => social.id === "social-false")?.showOnCard).toBe(false);
    expect(reconciled.socials.find((social) => social.id === "social-missing")?.showOnCard).toBe(false);
  });
});
