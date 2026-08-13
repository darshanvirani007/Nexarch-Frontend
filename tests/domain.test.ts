import { describe, expect, it } from "vitest";
import { accountSettingsSchema, businessLinkSchema, businessSchema, changePasswordSchema, commerceOrderSchema, commerceProductSchema, commerceStoreSchema, personalLinkSchema, signUpSchema, socialAccountSchema } from "../lib/validations";
import { filterTasks, ownsRecord, websiteStatusFromResponse } from "../lib/domain";
import { progress, safeUrl } from "../lib/utils";
import { buildCommerceAlerts, orderNetSales, orderProfit, safeRatio, summarizeCommerce } from "../lib/commerce";
import { demoCommerceExpenses, demoCommerceOrders, demoCommerceProducts, demoCommerceStores } from "../lib/commerce";
import { coverageForStore, coveragePercentage, demoTrackingAlerts, freshness, getVisibleTrackingAlerts, providerCapabilities, readPermissions, prohibitedActions } from "../lib/commerce-tracking";
import type { Task } from "../lib/types";

describe("account sign-up", () => {
  const validAccount = { email: "darshan@example.com", fullName: "Darshan Virani", country: "Ireland", contactNumber: "+353 87 123 4567", password: "secure-password", confirmPassword: "secure-password" };

  it("accepts a complete matching account profile", () => {
    expect(signUpSchema.safeParse(validAccount).success).toBe(true);
  });

  it("rejects mismatched passwords and invalid contact details", () => {
    expect(signUpSchema.safeParse({ ...validAccount, confirmPassword: "different-password" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...validAccount, contactNumber: "abc" }).success).toBe(false);
  });

  it("validates editable account details and password changes", () => {
    expect(accountSettingsSchema.safeParse({ ...validAccount, timezone: "Europe/Dublin" }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ password: "new-password", confirmPassword: "new-password" }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ password: "new-password", confirmPassword: "wrong-password" }).success).toBe(false);
  });
});

describe("business mutations", () => {
  it("accepts valid creation and editing", () => {
    const created = businessSchema.parse({ name: "Northstar", description: "Studio", websiteUrl: "https://example.com", emailInboxUrl: "", adminUrl: "", hostingUrl: "", domainUrl: "" });
    expect(created.name).toBe("Northstar");
    expect(businessSchema.parse({ ...created, description: "Updated" }).description).toBe("Updated");
  });
  it("rejects unsafe or incomplete URLs", () => {
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(businessSchema.safeParse({ name: "Valid Name", description: "", websiteUrl: "example.com", emailInboxUrl: "", adminUrl: "", hostingUrl: "", domainUrl: "" }).success).toBe(false);
  });
  it("validates links and social accounts", () => {
    expect(businessLinkSchema.safeParse({ label: "Repository", url: "https://github.com/demo", category: "Development" }).success).toBe(true);
    expect(socialAccountSchema.safeParse({ platform: "LinkedIn", accountName: "Northstar", username: "northstar", profileUrl: "https://linkedin.com/company/demo" }).success).toBe(true);
    expect(socialAccountSchema.parse({ platform: "YouTube", accountName: "Northstar", username: "northstar", profileUrl: "https://youtube.com/@northstar", showOnCard: false })).toMatchObject({ platform: "YouTube", showOnCard: false });
    expect(socialAccountSchema.safeParse({ platform: "LinkedIn", accountName: "Northstar", username: "northstar", profileUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("personal links", () => {
  it("accepts supported personal accounts and full URLs", () => {
    expect(personalLinkSchema.safeParse({ name: "My GitHub", kind: "GitHub", url: "https://github.com/demo" }).success).toBe(true);
  });

  it("rejects unsafe personal link destinations", () => {
    expect(personalLinkSchema.safeParse({ name: "Unsafe link", kind: "Other", url: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("commerce calculations and validation", () => {
  it("calculates net sales, profit, margin, AOV, and division by zero safely", () => {
    const order = demoCommerceOrders[0];
    expect(orderNetSales(order)).toBe(98);
    expect(orderProfit(order)).toBeCloseTo(35.3);
    const summary = summarizeCommerce([order], demoCommerceProducts, []);
    expect(summary.averageOrderValue).toBe(98);
    expect(summary.netProfit).toBeCloseTo(35.3);
    expect(summary.profitMargin).toBeCloseTo(36.0204);
    expect(safeRatio(10, 0, 100)).toBe(0);
  });

  it("recomputes totals when costs and expenses change", () => {
    const baseline = summarizeCommerce(demoCommerceOrders, demoCommerceProducts, []);
    const withExpense = summarizeCommerce(demoCommerceOrders, demoCommerceProducts, demoCommerceExpenses);
    expect(withExpense.netProfit).toBe(baseline.netProfit - 39);
  });

  it("identifies delayed, fulfilment, stock, and loss alerts", () => {
    const alerts = buildCommerceAlerts(demoCommerceStores, demoCommerceProducts, demoCommerceOrders);
    expect(alerts.some((alert) => alert.id === "delayed")).toBe(true);
    expect(alerts.some((alert) => alert.id === "supplier")).toBe(true);
    expect(alerts.some((alert) => alert.id === "out")).toBe(true);
  });

  it("validates manual commerce records", () => {
    expect(commerceStoreSchema.safeParse({ name: "Amazon EU", platform: "Amazon", storeUrl: "https://amazon.de", adminUrl: "", region: "DE", currency: "eur" }).success).toBe(true);
    expect(commerceProductSchema.safeParse({ name: "Desk Mat", storeId: crypto.randomUUID(), sku: "DM-1", asin: "", productUrl: "", sellingPrice: 40, productCost: 12, shippingCost: 3, inventoryQuantity: 10, reorderThreshold: 4 }).success).toBe(true);
    expect(commerceOrderSchema.safeParse({ storeId: crypto.randomUUID(), externalOrderId: "ORDER-1", orderDate: "2026-07-30", grossAmount: 50, discount: 0, refundAmount: 0, productCost: 15, marketplaceFees: 7, paymentFees: 1, shippingCost: 4, advertisingAllocation: 5 }).success).toBe(true);
  });
});

describe("read-only commerce tracking", () => {
  it("removes dismissed alerts from every shared alert list", () => {
    const visible = getVisibleTrackingAlerts(demoTrackingAlerts, ["alert-stock"], demoCommerceStores.map((store) => store.id));
    expect(visible.some((alert) => alert.id === "alert-stock")).toBe(false);
    expect(visible.length).toBe(demoTrackingAlerts.length - 1);
  });

  it("reports data freshness without presenting stale data as current", () => {
    expect(freshness()).toBe("Never synchronised");
    expect(freshness(new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString())).toBe("Stale");
  });

  it("explains reduced functionality when data is unavailable", () => {
    const disconnected = { ...demoCommerceStores[0], connectionStatus: "Manual" as const };
    const coverage = coverageForStore(disconnected);
    expect(coverage.find((item) => item.category === "Orders")?.status).toBe("Permission required");
    expect(coverage.every((item) => item.reason.length > 0 && item.action.length > 0)).toBe(true);
  });

  it("calculates a bounded data coverage percentage", () => {
    expect(coveragePercentage(demoCommerceStores[0])).toBeGreaterThanOrEqual(0);
    expect(coveragePercentage(demoCommerceStores[0])).toBeLessThanOrEqual(100);
  });

  it("defines only read and sync provider capabilities", () => {
    expect(providerCapabilities.Amazon.orders).toBe(true);
    expect(providerCapabilities.Amazon.inventory).toBe(true);
    expect(Object.keys(providerCapabilities.Amazon).some((key) => key.startsWith("write") || key.includes("modify"))).toBe(false);
  });

  it("shows requested read permissions and prohibited write actions", () => {
    expect(readPermissions).toContain("Orders and order items");
    expect(prohibitedActions).toContain("Issue refunds");
    expect(prohibitedActions).toContain("Modify inventory");
  });

  it("does not model customer contact details in commerce orders", () => {
    const orderKeys = Object.keys(demoCommerceOrders[0]);
    expect(orderKeys).not.toContain("customerEmail");
    expect(orderKeys).not.toContain("deliveryAddress");
    expect(orderKeys).not.toContain("phoneNumber");
  });
});

describe("status checks", () => {
  it("classifies outcomes", () => {
    expect(websiteStatusFromResponse(200, 100)).toBe("online");
    expect(websiteStatusFromResponse(404, 100)).toBe("degraded");
    expect(websiteStatusFromResponse(503, 100)).toBe("offline");
    expect(websiteStatusFromResponse(200, 3000)).toBe("degraded");
  });
});

describe("authorization and progress", () => {
  it("only authorizes the owner", () => {
    expect(ownsRecord("user-a", "user-a")).toBe(true);
    expect(ownsRecord("user-a", "user-b")).toBe(false);
    expect(ownsRecord("user-a", null)).toBe(false);
  });
  it("calculates goal progress safely", () => {
    expect(progress(46, 120)).toBe(38);
    expect(progress(150, 100)).toBe(100);
    expect(progress(1, 0)).toBe(0);
  });
  it("filters tasks", () => {
    const today = new Date("2026-07-27T12:00:00Z");
    const tasks: Task[] = [
      { id: "1", title: "Today", area: "Personal", status: "Planned", priority: "Medium", dueDate: "2026-07-27T18:00:00Z", estimatedMinutes: 30, tags: [] },
      { id: "2", title: "Inbox", area: "Personal", status: "Inbox", priority: "Low", dueDate: "2026-07-29T18:00:00Z", estimatedMinutes: 10, tags: [] },
    ];
    expect(filterTasks(tasks, "Today", today)).toHaveLength(1);
    expect(filterTasks(tasks, "Inbox", today)[0].title).toBe("Inbox");
  });
});
