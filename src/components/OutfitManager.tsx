"use client";

import { useMemo, useState } from "react";
import type { ClosetItemRecord } from "@/lib/closet";
import type { OutfitSuggestion } from "@/lib/outfits";

export type OutfitRecord = {
  id: string;
  name: string;
  notes?: string | null;
  itemIds: string[];
  tags: string[];
  occasion?: string | null;
  imageData?: string | null;
  wearCount: number;
  lastWornAt?: string | null;
};

export function OutfitManager({
  initialOutfits,
  closetItems,
  premium,
}: {
  initialOutfits: OutfitRecord[];
  closetItems: ClosetItemRecord[];
  premium: boolean;
}) {
  const [outfits, setOutfits] = useState(initialOutfits);
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const byId = useMemo(() => new Map(closetItems.map((i) => [i.id, i])), [closetItems]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function refresh() {
    const res = await fetch("/api/outfits");
    if (!res.ok) return;
    const data = await res.json();
    setOutfits(data.outfits);
  }

  async function saveOutfit() {
    if (!name.trim() || selected.length < 1) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          itemIds: selected,
          occasion: occasion.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setName("");
      setOccasion("");
      setSelected([]);
      await refresh();
      setMessage("Outfit saved");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function suggest() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/outfits/suggest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Suggest failed");
      setSuggestions(data.suggestions || []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveSuggestion(s: OutfitSuggestion) {
    setBusy(true);
    try {
      const res = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: s.name,
          itemIds: s.itemIds,
          occasion: s.occasion || null,
          notes: s.rationale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      await refresh();
      setMessage(`Saved “${s.name}”`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function logWear(id: string) {
    await fetch(`/api/outfits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "wear" }),
    });
    await refresh();
  }

  async function generateImage(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/outfits/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfitId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image failed");
      await refresh();
      setMessage("AI image added");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this outfit?")) return;
    await fetch(`/api/outfits/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <section className="card-surface" style={{ padding: "1.25rem" }}>
        <h2 className="display" style={{ marginTop: 0, fontSize: "1.7rem" }}>
          Build outfit
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.75rem",
          }}
        >
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Monday work" />
          </div>
          <div className="field">
            <label>Occasion</label>
            <input
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="work / weekend"
            />
          </div>
        </div>
        <p style={{ color: "var(--ink-soft)" }}>Select owned items:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {closetItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="chip"
              data-on={selected.includes(item.id)}
              onClick={() => toggle(item.id)}
            >
              {item.category}: {item.name}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.85rem" }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !name.trim() || selected.length < 1}
            onClick={() => void saveOutfit()}
          >
            Save outfit
          </button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void suggest()}>
            AI ideas from my closet
          </button>
        </div>
        {message ? <p style={{ color: "var(--ink-soft)" }}>{message}</p> : null}
      </section>

      {suggestions.length ? (
        <section className="card-surface" style={{ padding: "1.25rem" }}>
          <h2 className="display" style={{ marginTop: 0, fontSize: "1.6rem" }}>
            Suggestions
          </h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {suggestions.map((s) => (
              <div
                key={`${s.name}-${s.itemIds.join("-")}`}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  padding: "0.85rem",
                }}
              >
                <strong>{s.name}</strong>
                <p style={{ margin: "0.35rem 0", color: "var(--ink-soft)", fontSize: "0.92rem" }}>
                  {s.rationale}
                </p>
                <p style={{ margin: 0, fontSize: "0.88rem" }}>
                  {s.itemIds.map((id) => byId.get(id)?.name || id).join(" · ")}
                </p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: "0.55rem", padding: "0.4rem 0.8rem" }}
                  disabled={busy}
                  onClick={() => void saveSuggestion(s)}
                >
                  Save this look
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section style={{ display: "grid", gap: "0.85rem" }}>
        {outfits.map((outfit) => (
          <article key={outfit.id} className="card-surface" style={{ padding: "1rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: outfit.imageData ? "120px 1fr" : "1fr",
                gap: "0.85rem",
              }}
            >
              {outfit.imageData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={outfit.imageData}
                  alt={outfit.name}
                  style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12 }}
                />
              ) : null}
              <div>
                <strong>{outfit.name}</strong>
                {outfit.occasion ? (
                  <span style={{ color: "var(--ink-soft)" }}> · {outfit.occasion}</span>
                ) : null}
                <p style={{ margin: "0.35rem 0", color: "var(--ink-soft)", fontSize: "0.92rem" }}>
                  {outfit.itemIds.map((id) => byId.get(id)?.name || id).join(" · ")}
                </p>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--ink-soft)" }}>
                  Worn {outfit.wearCount}×
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.55rem" }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                    onClick={() => void logWear(outfit.id)}
                  >
                    Worn today
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                    disabled={busy}
                    onClick={() => void generateImage(outfit.id)}
                  >
                    {premium ? "AI image" : "AI image (Premium)"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                    onClick={() => void remove(outfit.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
        {!outfits.length ? (
          <p style={{ color: "var(--ink-soft)" }}>No saved outfits yet.</p>
        ) : null}
      </section>
    </div>
  );
}
