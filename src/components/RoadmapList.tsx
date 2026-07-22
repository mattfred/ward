"use client";

import { useState } from "react";
import type { RoadmapItem } from "@/lib/types";

export function RoadmapList({ items: initial }: { items: RoadmapItem[] }) {
  const [items, setItems] = useState(initial);

  async function toggle(itemId: string, done: boolean) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, done } : i)));
    await fetch("/api/roadmap/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, done }),
    });
  }

  return (
    <ol style={{ marginTop: "1rem", paddingLeft: 0, listStyle: "none", display: "grid", gap: "0.65rem" }}>
      {items.map((item) => (
        <li
          key={item.id}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "0.75rem",
            padding: "0.85rem",
            borderRadius: 14,
            border: "1px solid var(--line)",
            background: item.done ? "rgba(47,93,74,0.1)" : "rgba(255,255,255,0.5)",
            opacity: item.done ? 0.75 : 1,
          }}
        >
          <input
            type="checkbox"
            checked={item.done}
            onChange={(e) => toggle(item.id, e.target.checked)}
            aria-label={`Mark ${item.title} done`}
          />
          <div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "baseline" }}>
              <strong>
                #{item.order} {item.title}
              </strong>
              <span
                style={{
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--ink-soft)",
                }}
              >
                {item.budgetTier}
              </span>
            </div>
            <p style={{ margin: "0.3rem 0 0", color: "var(--ink-soft)", fontSize: "0.92rem" }}>
              {item.reason}
            </p>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>Unlocks: {item.unlocks}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
