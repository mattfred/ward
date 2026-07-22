import { describe, expect, it } from "vitest";
import {
  buildFallbackOutfitsFromCloset,
  buildTripChecklist,
  outfitLimitReached,
  tripDayCount,
  tripLimitReached,
} from "../src/lib/outfits";

describe("outfits & trips helpers", () => {
  it("builds outfit suggestions from owned categories", () => {
    const suggestions = buildFallbackOutfitsFromCloset([
      { id: "1", name: "White tee", category: "Tops" },
      { id: "2", name: "Navy trouser", category: "Bottoms" },
      { id: "3", name: "Loafer", category: "Shoes" },
    ]);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].itemIds).toContain("1");
    expect(suggestions[0].itemIds).toContain("2");
  });

  it("builds packing checklist and trip day count", () => {
    const map = new Map([
      ["a", { name: "Tee", category: "Tops" }],
      ["b", { name: "Jean", category: "Bottoms" }],
    ]);
    const list = buildTripChecklist(["a", "b"], map);
    expect(list).toHaveLength(2);
    expect(list[0].label).toContain("Tee");
    expect(tripDayCount("2026-08-01", "2026-08-05")).toBe(5);
    expect(outfitLimitReached(20, "free")).toBe(true);
    expect(tripLimitReached(2, "premium")).toBe(false);
  });
});
