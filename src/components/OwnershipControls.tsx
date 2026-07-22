"use client";

import { useMemo, useState } from "react";
import type { BlueprintPiece, OwnershipStatus, PreferenceMemory } from "@/lib/types";
import { pieceVisualBrief, shoppingLinks } from "@/lib/shopping";

export function OwnershipControls({
  pieces: controlledPieces,
  onOwnershipChange,
  onPiecesChange,
  onMemoryChange,
}: {
  pieces: BlueprintPiece[];
  onOwnershipChange?: (pieceId: string, ownership: OwnershipStatus) => void;
  onPiecesChange?: (pieces: BlueprintPiece[]) => void;
  onMemoryChange?: (memory: PreferenceMemory) => void;
}) {
  const [localPieces, setLocalPieces] = useState(controlledPieces);
  const pieces = onOwnershipChange || onPiecesChange ? controlledPieces : localPieces;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<BlueprintPiece>>({});
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, BlueprintPiece[]>();
    for (const p of pieces) {
      const key = p.eventName;
      map.set(key, [...(map.get(key) || []), p]);
    }
    return [...map.entries()];
  }, [pieces]);

  function applyPieces(next: BlueprintPiece[]) {
    if (onPiecesChange) onPiecesChange(next);
    else setLocalPieces(next);
  }

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

  async function patchPiece(body: Record<string, unknown>) {
    setBusyId(String(body.pieceId));
    setMessage(null);
    try {
      const res = await fetch("/api/blueprint/pieces", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      applyPieces(data.pieces as BlueprintPiece[]);
      if (data.memory && onMemoryChange) {
        onMemoryChange(data.memory);
      }
      setEditingId(null);
      setDraft({});
      setReason("");
      if (body.action === "reject" || (body.action === "remove" && body.reason)) {
        setMessage("Saved to your style memory — regenerations will respect this.");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(piece: BlueprintPiece) {
    setEditingId(piece.id);
    setDraft({
      name: piece.name,
      category: piece.category,
      rationale: piece.rationale,
      quantity: piece.quantity,
      visualBrief: pieceVisualBrief(piece),
      searchQuery: piece.searchQuery || "",
    });
    setReason("");
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
      {message ? (
        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.92rem" }}>{message}</p>
      ) : null}
      {grouped.map(([eventName, items]) => (
        <div key={eventName}>
          <h3 style={{ marginBottom: "0.6rem" }}>{eventName}</h3>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {items.map((piece) => {
              const links = shoppingLinks(piece);
              const editing = editingId === piece.id;
              const busy = busyId === piece.id;
              return (
                <div
                  key={piece.id}
                  style={{
                    display: "grid",
                    gap: "0.75rem",
                    padding: "0.95rem",
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                    background: "rgba(255,255,255,0.5)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "0.75rem",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <strong>
                        {piece.category}: {piece.name}
                      </strong>
                      <p
                        style={{
                          margin: "0.35rem 0 0",
                          color: "var(--ink-soft)",
                          fontSize: "0.92rem",
                        }}
                      >
                        {piece.rationale}
                      </p>
                      <p
                        style={{
                          margin: "0.55rem 0 0",
                          fontSize: "0.88rem",
                          color: "var(--ink-soft)",
                        }}
                      >
                        {pieceVisualBrief(piece)}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.45rem",
                          marginTop: "0.65rem",
                        }}
                      >
                        <a
                          className="btn btn-ghost"
                          href={links.images}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                        >
                          Reference images
                        </a>
                        <a
                          className="btn btn-ghost"
                          href={links.shop}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                        >
                          Shop similar + prices
                        </a>
                      </div>
                    </div>
                    <select
                      value={piece.ownership}
                      onChange={(e) =>
                        setOwnership(piece.id, e.target.value as OwnershipStatus)
                      }
                      aria-label={`Ownership for ${piece.name}`}
                    >
                      <option value="not_owned">Not owned</option>
                      <option value="owned">Owned</option>
                      <option value="owned_but_wrong">Owned, wrong</option>
                    </select>
                  </div>

                  {editing ? (
                    <div style={{ display: "grid", gap: "0.55rem" }}>
                      <div className="field">
                        <label>Name</label>
                        <input
                          value={draft.name || ""}
                          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        />
                      </div>
                      <div className="field">
                        <label>Category</label>
                        <input
                          value={draft.category || ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, category: e.target.value }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Why it belongs</label>
                        <textarea
                          rows={3}
                          value={draft.rationale || ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, rationale: e.target.value }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label>What to look for (visual brief)</label>
                        <textarea
                          rows={2}
                          value={draft.visualBrief || ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, visualBrief: e.target.value }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Search query (images / shopping)</label>
                        <input
                          value={draft.searchQuery || ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, searchQuery: e.target.value }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Teach the AI (optional)</label>
                        <input
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. I wear trousers, not dresses"
                        />
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={busy}
                          onClick={() =>
                            patchPiece({
                              action: "update",
                              pieceId: piece.id,
                              reason: reason || undefined,
                              patch: {
                                name: draft.name,
                                category: draft.category,
                                rationale: draft.rationale,
                                quantity: draft.quantity || 1,
                                visualBrief: draft.visualBrief,
                                searchQuery: draft.searchQuery,
                              },
                            })
                          }
                        >
                          {busy ? "Saving…" : "Save changes"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(null);
                            setDraft({});
                            setReason("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                        onClick={() => startEdit(piece)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                        disabled={busy}
                        onClick={() => {
                          const why = window.prompt(
                            "Optional: tell Ward why to remove this (helps future suggestions)",
                            "",
                          );
                          if (why === null) return;
                          patchPiece({
                            action: why.trim() ? "reject" : "remove",
                            pieceId: piece.id,
                            reason: why.trim() || undefined,
                          });
                        }}
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                        disabled={busy}
                        onClick={() => {
                          const why = window.prompt(
                            "What should Ward remember? (required)",
                            "I don't wear dresses — suggest trousers or skirts I actually use",
                          );
                          if (!why?.trim()) return;
                          patchPiece({
                            action: "reject",
                            pieceId: piece.id,
                            reason: why.trim(),
                          });
                        }}
                      >
                        Remove + teach AI
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
