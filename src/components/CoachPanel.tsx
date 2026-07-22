"use client";

import type { CoachResponse } from "@/lib/intake";

export function CoachPanel({
  coach,
  loading,
  onApplyChip,
}: {
  coach: CoachResponse | null;
  loading: boolean;
  onApplyChip: (chip: string) => void;
}) {
  if (!coach && !loading) return null;

  return (
    <aside
      className="card-surface"
      style={{
        padding: "1rem",
        marginTop: "1rem",
        background: "rgba(47,93,74,0.08)",
        borderColor: "rgba(47,93,74,0.28)",
      }}
    >
      <p style={{ margin: 0, fontWeight: 650, fontSize: "0.92rem" }}>Style coach</p>
      {loading && !coach ? (
        <p style={{ margin: "0.45rem 0 0", color: "var(--ink-soft)" }}>Thinking…</p>
      ) : null}
      {coach ? (
        <>
          <p style={{ margin: "0.45rem 0 0", lineHeight: 1.5 }}>{coach.summary}</p>
          {coach.clarifyingQuestion ? (
            <p style={{ margin: "0.55rem 0 0", color: "var(--ink-soft)", fontStyle: "italic" }}>
              {coach.clarifyingQuestion}
            </p>
          ) : null}
          {coach.suggestedChips.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "0.75rem" }}>
              {coach.suggestedChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="chip"
                  onClick={() => onApplyChip(chip)}
                >
                  + {chip}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
