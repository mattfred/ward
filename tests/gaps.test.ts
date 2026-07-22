import { describe, expect, it } from "vitest";
import { analyzeOwnership, computeWeeklyFocus } from "../src/lib/gaps";
import type { BlueprintPiece } from "../src/lib/types";

const pieces: BlueprintPiece[] = [
  {
    id: "a",
    eventId: "work",
    eventName: "Work",
    category: "Tops",
    name: "Navy knit",
    rationale: "r",
    quantity: 1,
    priority: 1,
    ownership: "not_owned",
  },
  {
    id: "b",
    eventId: "work",
    eventName: "Work",
    category: "Bottoms",
    name: "Wrong trousers",
    rationale: "r",
    quantity: 1,
    priority: 2,
    ownership: "owned_but_wrong",
  },
  {
    id: "c",
    eventId: "work",
    eventName: "Work",
    category: "Shoes",
    name: "Keepers",
    rationale: "r",
    quantity: 1,
    priority: 3,
    ownership: "owned",
  },
];

describe("gaps", () => {
  it("classifies keep/replace/gaps", () => {
    const insight = analyzeOwnership(pieces);
    expect(insight.keep).toHaveLength(1);
    expect(insight.replace).toHaveLength(1);
    expect(insight.gaps).toHaveLength(1);
    expect(insight.summary).toContain("gap");
  });

  it("builds weekly focus from highest priority open item", () => {
    expect(computeWeeklyFocus(pieces)).toContain("Navy knit");
  });
});
