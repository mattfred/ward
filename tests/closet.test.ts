import { describe, expect, it } from "vitest";
import {
  applyWear,
  closetLimitReached,
  costPerWear,
  formatCostPerWear,
  formatItemAge,
  isAllowedImageData,
  itemAgeDays,
} from "../src/lib/closet";

describe("closet helpers", () => {
  it("computes item age in days", () => {
    const now = new Date("2026-07-22T12:00:00Z");
    expect(itemAgeDays("2026-07-12T12:00:00Z", now)).toBe(10);
    expect(itemAgeDays(null, now)).toBeNull();
    expect(formatItemAge("2026-07-12T12:00:00Z", now)).toBe("10 days old");
  });

  it("computes cost per wear", () => {
    expect(costPerWear(100, 0)).toBe(100);
    expect(costPerWear(100, 4)).toBe(25);
    expect(costPerWear(null, 3)).toBeNull();
    expect(formatCostPerWear(80, 4)).toBe("$20.00 / wear");
  });

  it("increments wear count", () => {
    const next = applyWear({ wearCount: 2 }, new Date("2026-07-22T00:00:00Z"));
    expect(next.wearCount).toBe(3);
    expect(next.lastWornAt).toBe("2026-07-22T00:00:00.000Z");
  });

  it("validates image payloads and freemium limit", () => {
    expect(isAllowedImageData("https://cdn.example.com/a.jpg")).toBe(true);
    expect(isAllowedImageData("data:image/jpeg;base64,abc")).toBe(true);
    expect(isAllowedImageData("javascript:alert(1)")).toBe(false);
    expect(closetLimitReached(60, "free")).toBe(true);
    expect(closetLimitReached(60, "premium")).toBe(false);
  });
});
