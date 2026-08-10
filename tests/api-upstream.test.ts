import { describe, expect, it } from "vitest";
import { buildNexarchUpstreamUrl } from "../lib/api/upstream";

describe("Nexarch API upstream URL", () => {
  it("preserves an API prefix, path, and query", () => {
    const url = buildNexarchUpstreamUrl(
      "https://nexarch-api.onrender.com/api/v1/",
      ["businesses", "business-id"],
      "?archived=1",
    );

    expect(url.toString()).toBe(
      "https://nexarch-api.onrender.com/api/v1/businesses/business-id?archived=1",
    );
  });

  it("rejects unsafe upstream protocols", () => {
    expect(() => buildNexarchUpstreamUrl("http://example.com/api/v1", ["links"], ""))
      .toThrow("must use HTTPS");
  });

  it("rejects path traversal segments", () => {
    expect(() => buildNexarchUpstreamUrl("https://api.example.com/v1", ["..", "links"], ""))
      .toThrow("path is invalid");
  });
});
