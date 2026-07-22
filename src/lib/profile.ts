import { parseJson } from "@/lib/session";
import { emptyPreferenceMemory, normalizeMemory } from "@/lib/memory";
import type { PreferenceMemory, StyleProfileInput } from "@/lib/types";

type StyleProfileRow = {
  aestheticRefs: string;
  preferredColors: string;
  avoidColors: string;
  fitPreferences: string;
  climate: string | null;
  budgetTier: string | null;
  trustedBrands: string;
  values: string;
  notes: string | null;
  genderPresentation?: string | null;
  ageRange?: string | null;
  bodyNotes?: string | null;
  heightBand?: string | null;
  constraints?: string | null;
  inspirationRefs?: string | null;
  antiRefs?: string | null;
  formalityRange?: string | null;
  closetHonesty?: string | null;
  intakeMode?: string | null;
  preferenceMemory?: string | null;
};

export function profileFromRow(row: StyleProfileRow): StyleProfileInput {
  return {
    aestheticRefs: parseJson(row.aestheticRefs, []),
    preferredColors: parseJson(row.preferredColors, []),
    avoidColors: parseJson(row.avoidColors, []),
    fitPreferences: parseJson(row.fitPreferences, {
      tops: "",
      bottoms: "",
      overall: "",
    }),
    climate: row.climate || "",
    budgetTier: (row.budgetTier as "low" | "mid" | "high") || "mid",
    trustedBrands: parseJson(row.trustedBrands, []),
    values: parseJson(row.values, []),
    notes: row.notes || undefined,
    genderPresentation: row.genderPresentation || undefined,
    ageRange: row.ageRange || undefined,
    bodyNotes: row.bodyNotes || undefined,
    heightBand: row.heightBand || undefined,
    constraints: parseJson(row.constraints, []),
    inspirationRefs: parseJson(row.inspirationRefs, []),
    antiRefs: parseJson(row.antiRefs, []),
    formalityRange: row.formalityRange || undefined,
    closetHonesty: row.closetHonesty || undefined,
    intakeMode: row.intakeMode === "studio" ? "studio" : "guided",
  };
}

export function memoryFromRow(row: { preferenceMemory?: string | null }): PreferenceMemory {
  if (!row.preferenceMemory) return emptyPreferenceMemory();
  return normalizeMemory(parseJson(row.preferenceMemory, emptyPreferenceMemory()));
}
