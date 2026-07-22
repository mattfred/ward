import type { BlueprintPiece } from "@/lib/types";

export type BlueprintCoverage = {
  pieceId: string;
  pieceName: string;
  category: string;
  eventName: string;
  filledBy: { id: string; name: string }[];
  status: "filled" | "gap";
};

export function computeBlueprintCoverage(
  pieces: BlueprintPiece[],
  closetItems: { id: string; name: string; blueprintPieceId?: string | null; archived?: boolean }[],
): BlueprintCoverage[] {
  const active = closetItems.filter((i) => !i.archived);
  return pieces.map((piece) => {
    const filledBy = active
      .filter((i) => i.blueprintPieceId === piece.id)
      .map((i) => ({ id: i.id, name: i.name }));
    return {
      pieceId: piece.id,
      pieceName: piece.name,
      category: piece.category,
      eventName: piece.eventName,
      filledBy,
      status: filledBy.length ? ("filled" as const) : ("gap" as const),
    };
  });
}

export function coverageSummary(rows: BlueprintCoverage[]) {
  const filled = rows.filter((r) => r.status === "filled").length;
  return {
    filled,
    gaps: rows.length - filled,
    total: rows.length,
    percent: rows.length ? Math.round((filled / rows.length) * 100) : 0,
  };
}
