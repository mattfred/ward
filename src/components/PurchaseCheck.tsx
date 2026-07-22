"use client";

import { useState } from "react";
import { UpgradeButton } from "./UpgradeButton";
import type { PurchaseFitResult } from "@/lib/types";

export function PurchaseCheck({ premium }: { premium: boolean }) {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<PurchaseFitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!premium) {
    return (
      <div>
        <p style={{ color: "var(--ink-soft)" }}>
          Paste a product description before you buy — Premium scores it against your style system.
        </p>
        <UpgradeButton label="Unlock purchase-fit checks" />
      </div>
    );
  }

  async function onCheck() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/purchase-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <textarea
        rows={4}
        placeholder="e.g. Olive wool overshirt, boxy fit, midweight — $180"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button className="btn btn-primary" onClick={onCheck} disabled={loading || description.length < 8}>
        {loading ? "Scoring…" : "Check fit"}
      </button>
      {error ? <p style={{ color: "#9b2c2c", margin: 0 }}>{error}</p> : null}
      {result ? (
        <div
          style={{
            padding: "1rem",
            borderRadius: 14,
            border: "1px solid var(--line)",
            background: "rgba(255,255,255,0.55)",
          }}
        >
          <p className="display" style={{ fontSize: "1.6rem", margin: 0 }}>
            {result.score}/100 · {result.verdict}
          </p>
          <ul>
            {result.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {result.suggestions.length ? (
            <>
              <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Suggestions</p>
              <ul>
                {result.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
