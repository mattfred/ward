import type { BlueprintPiece, PreferenceMemory, PreferenceMemoryNote } from "@/lib/types";

export function emptyPreferenceMemory(): PreferenceMemory {
  return {
    hardRules: [],
    rejectedCategories: [],
    rejectedNames: [],
    notes: [],
    edits: [],
  };
}

export function normalizeMemory(raw: unknown): PreferenceMemory {
  const base = emptyPreferenceMemory();
  if (!raw || typeof raw !== "object") return base;
  const m = raw as Partial<PreferenceMemory>;
  return {
    hardRules: uniqStrings(m.hardRules),
    rejectedCategories: uniqStrings(m.rejectedCategories),
    rejectedNames: uniqStrings(m.rejectedNames),
    notes: Array.isArray(m.notes)
      ? m.notes
          .filter((n): n is PreferenceMemoryNote => Boolean(n && typeof n === "object" && n.text))
          .slice(-40)
      : [],
    edits: Array.isArray(m.edits)
      ? m.edits
          .filter((e) => e && typeof e === "object" && e.from && e.to)
          .slice(-40)
      : [],
  };
}

function uniqStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))].slice(0, 40);
}

export function rememberRejection(
  memory: PreferenceMemory,
  piece: BlueprintPiece,
  reason: string,
): PreferenceMemory {
  const note: PreferenceMemoryNote = {
    at: new Date().toISOString(),
    text: reason.trim() || `Removed “${piece.name}” (${piece.category})`,
    pieceName: piece.name,
    category: piece.category,
  };
  const hard = reason.trim()
    ? `Do not suggest ${piece.category.toLowerCase()} like “${piece.name}”: ${reason.trim()}`
    : `Do not suggest pieces like “${piece.name}” in ${piece.category}`;

  return normalizeMemory({
    ...memory,
    rejectedCategories: [...memory.rejectedCategories, piece.category],
    rejectedNames: [...memory.rejectedNames, piece.name],
    hardRules: [...memory.hardRules, hard],
    notes: [...memory.notes, note],
  });
}

export function rememberEdit(
  memory: PreferenceMemory,
  before: BlueprintPiece,
  after: BlueprintPiece,
  reason?: string,
): PreferenceMemory {
  const changed =
    before.name !== after.name ||
    before.category !== after.category ||
    before.rationale !== after.rationale;

  if (!changed && !reason?.trim()) return memory;

  const next = { ...memory };
  if (before.name !== after.name || before.category !== after.category) {
    next.edits = [
      ...memory.edits,
      {
        at: new Date().toISOString(),
        from: `${before.category}: ${before.name}`,
        to: `${after.category}: ${after.name}`,
        reason: reason?.trim() || undefined,
      },
    ];
  }
  if (reason?.trim()) {
    next.notes = [
      ...memory.notes,
      {
        at: new Date().toISOString(),
        text: reason.trim(),
        pieceName: after.name,
        category: after.category,
      },
    ];
    next.hardRules = [
      ...memory.hardRules,
      `User corrected wardrobe piece: prefer “${after.name}” (${after.category}) over “${before.name}” (${before.category}). ${reason.trim()}`,
    ];
  }
  return normalizeMemory(next);
}

/** Drop fallback/AI pieces that clearly conflict with memory. */
export function filterPiecesByMemory(
  pieces: BlueprintPiece[],
  memory: PreferenceMemory,
): BlueprintPiece[] {
  const rejectedCats = new Set(memory.rejectedCategories.map((c) => c.toLowerCase()));
  const rejectedNames = memory.rejectedNames.map((n) => n.toLowerCase());
  const hard = memory.hardRules.join(" ").toLowerCase();

  return pieces.filter((piece) => {
    const cat = piece.category.toLowerCase();
    const name = piece.name.toLowerCase();
    if (rejectedCats.has(cat)) return false;
    if (rejectedNames.some((n) => name.includes(n) || n.includes(name))) return false;
    // Soft keyword guard from hard rules (e.g. "dress")
    if (/\bdress(es)?\b/.test(hard) && /\bdress(es)?\b/.test(name)) return false;
    return true;
  });
}

export function memoryPromptBlock(memory: PreferenceMemory): string {
  if (
    !memory.hardRules.length &&
    !memory.rejectedCategories.length &&
    !memory.notes.length &&
    !memory.edits.length
  ) {
    return "No user corrections yet.";
  }
  return JSON.stringify(
    {
      hardRules: memory.hardRules.slice(-20),
      rejectedCategories: memory.rejectedCategories,
      rejectedNames: memory.rejectedNames.slice(-20),
      recentNotes: memory.notes.slice(-12).map((n) => n.text),
      recentEdits: memory.edits.slice(-12),
    },
    null,
    0,
  );
}
