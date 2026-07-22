import { describe, expect, it } from "vitest";
import {
  emptyPreferenceMemory,
  filterPiecesByMemory,
  rememberRejection,
} from "../src/lib/memory";
import type { BlueprintPiece } from "../src/lib/types";

const piece = (partial: Partial<BlueprintPiece> & Pick<BlueprintPiece, "id" | "name" | "category">): BlueprintPiece => ({
  eventId: "work",
  eventName: "Work",
  rationale: "test",
  quantity: 1,
  priority: 1,
  ownership: "not_owned",
  ...partial,
});

describe("preference memory", () => {
  it("records rejections and filters matching pieces", () => {
    const memory = rememberRejection(emptyPreferenceMemory(), piece({
      id: "1",
      name: "Midi dress",
      category: "Dresses",
    }), "I don't wear dresses");

    expect(memory.rejectedCategories).toContain("Dresses");
    expect(memory.hardRules.some((r) => r.toLowerCase().includes("dress"))).toBe(true);

    const kept = filterPiecesByMemory(
      [
        piece({ id: "1", name: "Midi dress", category: "Dresses" }),
        piece({ id: "2", name: "Core trouser", category: "Bottoms" }),
      ],
      memory,
    );
    expect(kept.map((p) => p.id)).toEqual(["2"]);
  });
});
