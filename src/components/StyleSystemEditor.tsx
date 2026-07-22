"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StyleSystemData } from "@/lib/types";

export function StyleSystemEditor({ system }: { system: StyleSystemData }) {
  const router = useRouter();
  const [manifesto, setManifesto] = useState(system.manifesto);
  const [alwaysRules, setAlwaysRules] = useState(system.alwaysRules.join("\n"));
  const [neverRules, setNeverRules] = useState(system.neverRules.join("\n"));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/style/system", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manifesto,
        alwaysRules: alwaysRules
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        neverRules: neverRules
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Save failed");
      return;
    }
    setMessage("Saved");
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: "0.85rem", marginTop: "1rem" }}>
      <div className="field">
        <label>Manifesto</label>
        <textarea rows={4} value={manifesto} onChange={(e) => setManifesto(e.target.value)} />
      </div>
      <div className="field">
        <label>Always rules (one per line)</label>
        <textarea rows={4} value={alwaysRules} onChange={(e) => setAlwaysRules(e.target.value)} />
      </div>
      <div className="field">
        <label>Never rules (one per line)</label>
        <textarea rows={4} value={neverRules} onChange={(e) => setNeverRules(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save edits"}
        </button>
        {message ? <span style={{ color: "var(--ink-soft)" }}>{message}</span> : null}
      </div>
    </div>
  );
}
