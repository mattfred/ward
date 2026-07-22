import type { BlueprintPiece } from "./types";

export type GapInsight = {
  keep: BlueprintPiece[];
  replace: BlueprintPiece[];
  gaps: BlueprintPiece[];
  summary: string;
};

export function analyzeOwnership(pieces: BlueprintPiece[]): GapInsight {
  const keep = pieces.filter((p) => p.ownership === "owned");
  const replace = pieces.filter((p) => p.ownership === "owned_but_wrong");
  const gaps = pieces
    .filter((p) => p.ownership === "not_owned")
    .sort((a, b) => a.priority - b.priority);

  const summary =
    gaps.length === 0 && replace.length === 0
      ? "Your marked pieces align with the blueprint — refine fit and finish next."
      : [
          gaps.length ? `${gaps.length} gap${gaps.length === 1 ? "" : "s"} to fill` : null,
          replace.length
            ? `${replace.length} piece${replace.length === 1 ? "" : "s"} to replace for cohesion`
            : null,
          keep.length ? `${keep.length} keeper${keep.length === 1 ? "" : "s"} already working` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return { keep, replace, gaps, summary };
}

export function computeWeeklyFocus(pieces: BlueprintPiece[], currentFocus?: string | null) {
  const nextGap = pieces
    .filter((p) => p.ownership === "not_owned" || p.ownership === "owned_but_wrong")
    .sort((a, b) => a.priority - b.priority)[0];

  if (!nextGap) {
    return currentFocus || "This week: wear your keepers intentionally and note what still feels off.";
  }

  const action = nextGap.ownership === "owned_but_wrong" ? "Replace" : "Add";
  return `This week: ${action} ${nextGap.name} — unlocks more looks for ${nextGap.eventName}.`;
}
