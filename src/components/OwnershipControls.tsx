"use client";

import { useMemo, useState } from "react";
import type { BlueprintPiece, OwnershipStatus } from "@/lib/types";

export function OwnershipControls({
  pieces: controlledPieces,
  onOwnershipChange,
}: {
  pieces: BlueprintPiece[];
  onOwnershipChange?: (pieceId: string, ownership: OwnershipStatus) => void;
}) {
  const [localPieces, setLocalPieces] = useState(controlledPieces);
  const pieces = onOwnershipChange ? controlledPieces : localPieces;

  const grouped = useMemo(() => {
    const map = new Map<string, BlueprintPiece[]>();
    for (const p of pieces) {
      const key = p.eventName;
      map.set(key, [...(map.get(key) || []), p]);
    }
    return [...map.entries()];
  }, [pieces]);

  async function setOwnership(pieceId: string, ownership: OwnershipStatus) {
    if (onOwnershipChange) {
      onOwnershipChange(pieceId, ownership);
    } else {
      setLocalPieces((prev) =>
        prev.map((p) => (p.id === pieceId ? { ...p, ownership } : p)),
      );
    }
    await fetch("/api/blueprint/ownership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pieceId, ownership }),
    });
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
      {grouped.map(([eventName, items]) => (
        <div key={eventName}>
          <h3 style={{ marginBottom: "0.6rem" }}>{eventName}</h3>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {items.map((piece) => (
              <div
                key={piece.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "0.75rem",
                  padding: "0.85rem",
                  borderRadius: 14,
                  border: "1px solid var(--line)",
                  background: "rgba(255,255,255,0.5)",
                }}
              >
                <div>
                  <strong>
                    {piece.category}: {piece.name}
                  </strong>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--ink-soft)", fontSize: "0.92rem" }}>
                    {piece.rationale}
                  </p>
                </div>
                <select
                  value={piece.ownership}
                  onChange={(e) => setOwnership(piece.id, e.target.value as OwnershipStatus)}
                  aria-label={`Ownership for ${piece.name}`}
                >
                  <option value="not_owned">Not owned</option>
                  <option value="owned">Owned</option>
                  <option value="owned_but_wrong">Owned, wrong</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
