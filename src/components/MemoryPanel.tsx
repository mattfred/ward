"use client";

import type { PreferenceMemory } from "@/lib/types";

export function MemoryPanel({ memory }: { memory: PreferenceMemory }) {
  const rules = memory.hardRules.slice(-6);
  const notes = memory.notes.slice(-4);
  if (!rules.length && !notes.length && !memory.rejectedCategories.length) {
    return (
      <section className="card-surface" style={{ padding: "1.2rem", marginTop: "1rem" }}>
        <h2 className="display" style={{ marginTop: 0, fontSize: "1.7rem" }}>
          Style memory
        </h2>
        <p style={{ color: "var(--ink-soft)", marginBottom: 0 }}>
          Edit or remove blueprint pieces and tell Ward why — those corrections stick across
          regenerations.
        </p>
      </section>
    );
  }

  return (
    <section className="card-surface" style={{ padding: "1.2rem", marginTop: "1rem" }}>
      <h2 className="display" style={{ marginTop: 0, fontSize: "1.7rem" }}>
        Style memory
      </h2>
      <p style={{ color: "var(--ink-soft)" }}>
        Ward keeps these corrections when regenerating your system and blueprint.
      </p>
      {memory.rejectedCategories.length ? (
        <p style={{ margin: "0.35rem 0", fontSize: "0.92rem" }}>
          Avoiding categories: {memory.rejectedCategories.join(", ")}
        </p>
      ) : null}
      {rules.length ? (
        <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }}>
          {rules.map((rule) => (
            <li key={rule} style={{ marginBottom: "0.35rem", color: "var(--ink-soft)" }}>
              {rule}
            </li>
          ))}
        </ul>
      ) : null}
      {notes.length && !rules.length ? (
        <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }}>
          {notes.map((n) => (
            <li key={`${n.at}-${n.text}`} style={{ color: "var(--ink-soft)" }}>
              {n.text}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
