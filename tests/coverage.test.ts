import { describe, expect, it } from "vitest";
import { computeBlueprintCoverage, coverageSummary } from "../src/lib/coverage";
import type { BlueprintPiece } from "../src/lib/types";

const piece = (id: string, name: string): BlueprintPiece => ({
  id,
  eventId: "work",
  eventName: "Work",
  category: "Tops",
  name,
  rationale: "x",
  quantity: 1,
  priority: 1,
  ownership: "not_owned",
});

describe("blueprint coverage", () => {
  it("maps closet items onto blueprint slots", () => {
    const rows = computeBlueprintCoverage(
      [piece("p1", "Primary knit"), piece("p2", "Core trouser")],
      [
        { id: "c1", name: "Merino", blueprintPieceId: "p1" },
        { id: "c2", name: "Old tee", archived: true, blueprintPieceId: "p2" },
      ],
    );
    expect(rows[0].status).toBe("filled");
    expect(rows[1].status).toBe("gap");
    expect(coverageSummary(rows)).toEqual({ filled: 1, gaps: 1, total: 2, percent: 50 });
  });
});
