"use client";

import { useMemo, useState } from "react";
import type { ClosetItemRecord } from "@/lib/closet";
import { tripDayCount, type PackingItem } from "@/lib/outfits";

export type TripRecord = {
  id: string;
  name: string;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  itemIds: string[];
  outfitIds: string[];
  notes?: string | null;
  packingChecklist: PackingItem[];
};

export function TripManager({
  initialTrips,
  closetItems,
}: {
  initialTrips: TripRecord[];
  closetItems: ClosetItemRecord[];
}) {
  const [trips, setTrips] = useState(initialTrips);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const byId = useMemo(() => new Map(closetItems.map((i) => [i.id, i])), [closetItems]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function refresh() {
    const res = await fetch("/api/trips");
    if (!res.ok) return;
    const data = await res.json();
    setTrips(data.trips);
  }

  async function createTrip() {
    if (!name.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          destination: destination.trim() || null,
          startDate: startDate ? new Date(`${startDate}T12:00:00.000Z`).toISOString() : null,
          endDate: endDate ? new Date(`${endDate}T12:00:00.000Z`).toISOString() : null,
          itemIds: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setName("");
      setDestination("");
      setStartDate("");
      setEndDate("");
      setSelected([]);
      await refresh();
      setMessage("Trip wardrobe created");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function togglePacked(trip: TripRecord, itemId: string) {
    const packingChecklist = trip.packingChecklist.map((row) =>
      row.itemId === itemId ? { ...row, packed: !row.packed } : row,
    );
    await fetch(`/api/trips/${trip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packingChecklist }),
    });
    await refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this trip wardrobe?")) return;
    await fetch(`/api/trips/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <section className="card-surface" style={{ padding: "1.25rem" }}>
        <h2 className="display" style={{ marginTop: 0, fontSize: "1.7rem" }}>
          New trip / event wardrobe
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "0.75rem",
          }}
        >
          <div className="field">
            <label>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lisbon week / Wedding"
            />
          </div>
          <div className="field">
            <label>Destination</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City or venue"
            />
          </div>
          <div className="field">
            <label>Start</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <label>End</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <p style={{ color: "var(--ink-soft)" }}>Pack from closet:</p>
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
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: "0.85rem" }}
          disabled={busy || !name.trim()}
          onClick={() => void createTrip()}
        >
          Create trip wardrobe
        </button>
        {message ? <p style={{ color: "var(--ink-soft)" }}>{message}</p> : null}
      </section>

      {trips.map((trip) => {
        const days = tripDayCount(trip.startDate, trip.endDate);
        const packed = trip.packingChecklist.filter((p) => p.packed).length;
        return (
          <article key={trip.id} className="card-surface" style={{ padding: "1.1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
              <div>
                <strong className="display" style={{ fontSize: "1.35rem" }}>
                  {trip.name}
                </strong>
                <p style={{ margin: "0.35rem 0", color: "var(--ink-soft)" }}>
                  {[trip.destination, days ? `${days} days` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "0.4rem 0.8rem" }}
                onClick={() => void remove(trip.id)}
              >
                Delete
              </button>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>
              Packed {packed}/{trip.packingChecklist.length}
            </p>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              {trip.packingChecklist.map((row) => (
                <label key={row.itemId} style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={row.packed}
                    onChange={() => void togglePacked(trip, row.itemId)}
                  />
                  <span>
                    {row.label}
                    {byId.get(row.itemId)?.color ? ` · ${byId.get(row.itemId)?.color}` : ""}
                  </span>
                </label>
              ))}
              {!trip.packingChecklist.length ? (
                <p style={{ color: "var(--ink-soft)" }}>No items packed yet — edit by recreating with selections.</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
