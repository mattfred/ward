import { describe, expect, it } from "vitest";
import {
  buildFallbackBlueprint,
  buildFallbackPurchaseFit,
  buildFallbackRoadmap,
  buildFallbackStyleSystem,
} from "../src/lib/ai";
import type { LifeEvent, StyleProfileInput } from "../src/lib/types";

const profile: StyleProfileInput = {
  aestheticRefs: ["modern classic"],
  preferredColors: ["navy", "cream"],
  avoidColors: ["rust"],
  fitPreferences: {
    tops: "structured",
    bottoms: "tapered",
    overall: "clean tailored",
  },
  climate: "four seasons",
  budgetTier: "mid",
  trustedBrands: ["Uniqlo"],
  values: ["versatility"],
};

const events: LifeEvent[] = [
  { id: "work", name: "Work week", frequency: "5x", dressCode: "smart casual", priority: 1 },
];

describe("AI fallbacks", () => {
  it("builds a style system", () => {
    const system = buildFallbackStyleSystem(profile, events);
    expect(system.manifesto.length).toBeGreaterThan(40);
    expect(system.palette.length).toBeGreaterThan(0);
    expect(system.alwaysRules.length).toBeGreaterThan(0);
  });

  it("builds blueprint and roadmap", () => {
    const system = buildFallbackStyleSystem(profile, events);
    const pieces = buildFallbackBlueprint(system, events);
    expect(pieces.length).toBeGreaterThan(5);
    const roadmap = buildFallbackRoadmap(pieces);
    expect(roadmap.items[0].order).toBe(1);
    expect(roadmap.weeklyFocus).toContain("This week");
  });

  it("scores purchase fit", () => {
    const system = buildFallbackStyleSystem(profile, events);
    const fit = buildFallbackPurchaseFit("Navy tailored wool blazer", system);
    expect(fit.score).toBeGreaterThan(50);
    expect(["fits", "stretch", "skip"]).toContain(fit.verdict);
  });
});
