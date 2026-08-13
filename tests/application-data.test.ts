import { describe, expect, it } from "vitest";
import { shouldBlockForApplicationData } from "../lib/application-data";

describe("application data loading gate", () => {
  it("does not block Settings behind the complete dashboard bootstrap", () => {
    expect(shouldBlockForApplicationData("/settings")).toBe(false);
  });

  it("continues protecting data-backed application pages", () => {
    expect(shouldBlockForApplicationData("/dashboard")).toBe(true);
    expect(shouldBlockForApplicationData("/businesses")).toBe(true);
  });
});
