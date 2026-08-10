import { describe, expect, it, vi } from "vitest";
import { persistNewBusinessChildren, type BusinessChildApi } from "../lib/api/business-persistence";
import type { Business } from "../lib/types";

function business(overrides: Partial<Business> = {}): Business {
  return {
    id: "business-1",
    name: "Nexarch Studio",
    slug: "nexarch-studio",
    description: "Product studio",
    websiteUrl: "",
    websiteStatus: "unknown",
    emailProvider: "Custom",
    emailInboxUrl: "",
    adminUrl: "",
    hostingUrl: "",
    domainUrl: "",
    notes: "",
    isActive: true,
    displayOrder: 0,
    socials: [],
    links: [],
    ...overrides,
  };
}

function api() {
  return {
    createBusinessLink: vi.fn(async () => ({})),
    createSocial: vi.fn(async () => ({})),
    saveBusinessNote: vi.fn(async () => ({})),
  } satisfies BusinessChildApi;
}

describe("new business child persistence", () => {
  it("does not create child records for a business with only its required details", async () => {
    const client = api();
    const result = await persistNewBusinessChildren(business(), client);

    expect(result).toMatchObject({ attempted: 0, failures: [] });
    expect(client.createBusinessLink).not.toHaveBeenCalled();
    expect(client.createSocial).not.toHaveBeenCalled();
    expect(client.saveBusinessNote).not.toHaveBeenCalled();
  });

  it("persists primary links, custom links, social profiles, and notes with the generated business id", async () => {
    const client = api();
    const result = await persistNewBusinessChildren(business({
      websiteUrl: "https://nexarch.example/",
      emailInboxUrl: "https://mail.example/",
      adminUrl: "https://admin.example/",
      hostingUrl: "https://hosting.example/",
      domainUrl: "https://domains.example/",
      analyticsUrl: "https://analytics.example/",
      cardShortcutVisibility: { website: false },
      links: [{ id: "temporary-link", label: "Documentation", url: "https://docs.example/", category: "Documents", showOnCard: true }],
      socials: [{ id: "temporary-social", platform: "LinkedIn", accountName: "Nexarch", username: "nexarch", profileUrl: "https://linkedin.com/company/nexarch" }],
      notes: "Private business note",
    }), client);

    expect(result).toMatchObject({ attempted: 9, failures: [] });
    expect(client.createBusinessLink).toHaveBeenCalledTimes(7);
    expect(client.createBusinessLink).toHaveBeenCalledWith("business-1", expect.objectContaining({ link_type: "website", show_on_card: false }));
    expect(client.createBusinessLink).toHaveBeenCalledWith("business-1", expect.objectContaining({ link_type: "custom:documents", name: "Documentation" }));
    expect(client.createSocial).toHaveBeenCalledWith("business-1", expect.objectContaining({ platform: "linkedin", username: "nexarch" }));
    expect(client.saveBusinessNote).toHaveBeenCalledWith("business-1", "Private business note");
  });

  it("waits for every child request and reports partial failures without throwing", async () => {
    const client = api();
    client.createBusinessLink.mockRejectedValueOnce(new Error("link failed"));

    const result = await persistNewBusinessChildren(business({
      websiteUrl: "https://example.com",
      emailInboxUrl: "https://mail.example.com",
    }), client);

    expect(client.createBusinessLink).toHaveBeenCalledTimes(2);
    expect(result.attempted).toBe(2);
    expect(result.failures).toHaveLength(1);
  });
});
