"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CLOSET_CATEGORIES,
  CLOSET_CONDITIONS,
  CLOSET_SEASONS,
  formatCostPerWear,
  formatItemAge,
  type ClosetItemRecord,
} from "@/lib/closet";

async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 720;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.72);
}

const emptyForm = {
  name: "",
  category: "Tops",
  color: "",
  brand: "",
  notes: "",
  imageData: "" as string,
  acquiredAt: "",
  purchasePrice: "",
  condition: "good",
  season: "all",
};

export function ClosetManager({
  initialItems,
  blueprintOptions = [],
}: {
  initialItems: ClosetItemRecord[];
  blueprintOptions?: { id: string; label: string }[];
}) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [linkPieceId, setLinkPieceId] = useState("");

  const visible = useMemo(() => {
    if (filter === "all") return items.filter((i) => !i.archived);
    if (filter === "archived") return items.filter((i) => i.archived);
    return items.filter((i) => !i.archived && i.category === filter);
  }, [items, filter]);

  async function refresh() {
    const res = await fetch("/api/closet?archived=1");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items);
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((f) => ({ ...f, imageData: dataUrl }));
    } catch {
      setMessage("Could not process that image");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      color: form.color.trim() || null,
      brand: form.brand.trim() || null,
      notes: form.notes.trim() || null,
      imageData: form.imageData || null,
      acquiredAt: form.acquiredAt
        ? new Date(`${form.acquiredAt}T12:00:00.000Z`).toISOString()
        : null,
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
      condition: form.condition as (typeof CLOSET_CONDITIONS)[number],
      season: form.season as (typeof CLOSET_SEASONS)[number],
      blueprintPieceId: linkPieceId || null,
    };
    try {
      const res = await fetch(editingId ? `/api/closet/${editingId}` : "/api/closet", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setForm(emptyForm);
      setEditingId(null);
      setLinkPieceId("");
      await refresh();
      setMessage(editingId ? "Item updated" : "Item added");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item: ClosetItemRecord) {
    setEditingId(item.id);
    setLinkPieceId(item.blueprintPieceId || "");
    setForm({
      name: item.name,
      category: item.category,
      color: item.color || "",
      brand: item.brand || "",
      notes: item.notes || "",
      imageData: item.imageData || "",
      acquiredAt: item.acquiredAt ? item.acquiredAt.slice(0, 10) : "",
      purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : "",
      condition: item.condition || "good",
      season: item.season || "all",
    });
  }

  async function logWear(id: string) {
    const res = await fetch(`/api/closet/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "wear" }),
    });
    if (res.ok) await refresh();
  }

  async function archiveItem(id: string, archived: boolean) {
    await fetch(`/api/closet/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    await refresh();
  }

  async function removeItem(id: string) {
    if (!window.confirm("Delete this item permanently?")) return;
    await fetch(`/api/closet/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div className="card-surface" style={{ padding: "1.25rem" }}>
        <h2 className="display" style={{ marginTop: 0, fontSize: "1.7rem" }}>
          {editingId ? "Edit item" : "Add owned item"}
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
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Navy wool trouser"
            />
          </div>
          <div className="field">
            <label>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CLOSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Color</label>
            <input
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Brand</label>
            <input
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Acquired</label>
            <input
              type="date"
              value={form.acquiredAt}
              onChange={(e) => setForm((f) => ({ ...f, acquiredAt: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Price</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.purchasePrice}
              onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Condition</label>
            <select
              value={form.condition}
              onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
            >
              {CLOSET_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Season</label>
            <select
              value={form.season}
              onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
            >
              {CLOSET_SEASONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field" style={{ marginTop: "0.75rem" }}>
          <label>Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
        {blueprintOptions.length ? (
          <div className="field">
            <label>Fills blueprint slot (optional)</label>
            <select value={linkPieceId} onChange={(e) => setLinkPieceId(e.target.value)}>
              <option value="">None</option>
              {blueprintOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="field">
          <label>Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void onPickImage(e.target.files?.[0] || null)}
          />
          {form.imageData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.imageData}
              alt="Preview"
              style={{
                marginTop: "0.5rem",
                width: 120,
                height: 150,
                objectFit: "cover",
                borderRadius: 12,
                border: "1px solid var(--line)",
              }}
            />
          ) : null}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
          <button type="button" className="btn btn-primary" disabled={busy || !form.name.trim()} onClick={() => void save()}>
            {busy ? "Saving…" : editingId ? "Save changes" : "Add to closet"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setLinkPieceId("");
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
        {message ? <p style={{ color: "var(--ink-soft)" }}>{message}</p> : null}
      </div>

      <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
        <button type="button" className="chip" data-on={filter === "all"} onClick={() => setFilter("all")}>
          Active
        </button>
        {CLOSET_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className="chip"
            data-on={filter === c}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
        <button
          type="button"
          className="chip"
          data-on={filter === "archived"}
          onClick={() => setFilter("archived")}
        >
          Archived
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "0.85rem",
        }}
      >
        {visible.map((item) => (
          <article key={item.id} className="card-surface" style={{ padding: "0.85rem" }}>
            {item.imageData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageData}
                alt={item.name}
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 12,
                  marginBottom: "0.65rem",
                }}
              />
            ) : (
              <div
                style={{
                  height: 120,
                  borderRadius: 12,
                  background: "rgba(20,32,28,0.06)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--ink-soft)",
                  marginBottom: "0.65rem",
                }}
              >
                No photo
              </div>
            )}
            <strong>
              {item.category}: {item.name}
            </strong>
            <p style={{ margin: "0.35rem 0", color: "var(--ink-soft)", fontSize: "0.9rem" }}>
              Worn {item.wearCount}× · {formatItemAge(item.acquiredAt)}
              <br />
              {formatCostPerWear(item.purchasePrice, item.wearCount)}
              {item.blueprintPieceId ? (
                <>
                  <br />
                  Linked to blueprint
                </>
              ) : null}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                onClick={() => void logWear(item.id)}
              >
                + Wear
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                onClick={() => startEdit(item)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                onClick={() => void archiveItem(item.id, !item.archived)}
              >
                {item.archived ? "Restore" : "Archive"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                onClick={() => void removeItem(item.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {!visible.length ? (
        <p style={{ color: "var(--ink-soft)" }}>
          No items here yet. Add what you own so Ward can build outfits from your real closet.{" "}
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      ) : null}
    </div>
  );
}
