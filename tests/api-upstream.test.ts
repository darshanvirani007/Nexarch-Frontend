import { describe, expect, it } from "vitest";
import { shouldRetryReadRequest } from "../lib/api/retry";
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

describe("API cold-start retries", () => {
  it("retries a temporary failure for a read request once", () => {
    expect(shouldRetryReadRequest("GET", 502, 0)).toBe(true);
    expect(shouldRetryReadRequest("GET", 503, 1)).toBe(false);
  });

  it("never retries a write request", () => {
    expect(shouldRetryReadRequest("POST", 502, 0)).toBe(false);
    expect(shouldRetryReadRequest("PATCH", 503, 0)).toBe(false);
    expect(shouldRetryReadRequest("DELETE", 504, 0)).toBe(false);
  });

  it("does not retry normal client errors", () => {
    expect(shouldRetryReadRequest("GET", 401, 0)).toBe(false);
    expect(shouldRetryReadRequest("GET", 422, 0)).toBe(false);
  });
});
