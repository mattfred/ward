import { describe, expect, it } from "vitest";
import {
  isPremium,
  limitBlueprint,
  limitEvents,
  limitRoadmap,
} from "../src/lib/freemium";
import { FREE_ROADMAP_LIMIT } from "../src/lib/types";
import type { BlueprintPiece, LifeEvent, RoadmapItem } from "../src/lib/types";

const events: LifeEvent[] = [
  { id: "work", name: "Work", frequency: "5x", dressCode: "smart", priority: 1 },
  { id: "play", name: "Play", frequency: "2x", dressCode: "casual", priority: 2 },
];

const pieces: BlueprintPiece[] = [
  {
    id: "1",
    eventId: "work",
    eventName: "Work",
    category: "Tops",
    name: "Work top",
    rationale: "r",
    quantity: 1,
    priority: 1,
    ownership: "not_owned",
  },
  {
    id: "2",
    eventId: "play",
    eventName: "Play",
    category: "Tops",
    name: "Play top",
    rationale: "r",
    quantity: 1,
    priority: 2,
    ownership: "owned",
  },
];

const roadmap: RoadmapItem[] = Array.from({ length: 8 }, (_, i) => ({
  id: `r${i}`,
  pieceId: `p${i}`,
  title: `Item ${i + 1}`,
  reason: "r",
  budgetTier: "essential" as const,
  order: i + 1,
  unlocks: "u",
  done: false,
}));

describe("freemium", () => {
  it("detects premium", () => {
    expect(isPremium("premium")).toBe(true);
    expect(isPremium("free")).toBe(false);
  });

  it("limits free users to one event and primary blueprint", () => {
    expect(limitEvents(events, "free")).toHaveLength(1);
    expect(limitEvents(events, "premium")).toHaveLength(2);
    expect(limitBlueprint(pieces, "free", "work")).toEqual([pieces[0]]);
    expect(limitBlueprint(pieces, "premium", "work")).toHaveLength(2);
  });

  it("limits free roadmap to top N", () => {
    expect(limitRoadmap(roadmap, "free")).toHaveLength(FREE_ROADMAP_LIMIT);
    expect(limitRoadmap(roadmap, "premium")).toHaveLength(8);
  });
});
