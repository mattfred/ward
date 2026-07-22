"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaletteSwatch, StyleSystemData } from "@/lib/types";

function linesToList(value: string) {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function paletteToText(palette: PaletteSwatch[]) {
  return palette.map((s) => `${s.name}|${s.hex}`).join("\n");
}

function textToPalette(value: string): PaletteSwatch[] {
  return linesToList(value)
    .map((line) => {
      const [name, hex] = line.split("|").map((s) => s.trim());
      if (!name || !hex) return null;
      return { name, hex };
    })
    .filter((s): s is PaletteSwatch => Boolean(s));
}

export function StyleSystemEditor({ system }: { system: StyleSystemData }) {
  const router = useRouter();
  const [manifesto, setManifesto] = useState(system.manifesto);
  const [palette, setPalette] = useState(paletteToText(system.palette));
  const [silhouettes, setSilhouettes] = useState(system.silhouettes.join("\n"));
  const [fabrics, setFabrics] = useState(system.fabrics.join("\n"));
  const [alwaysRules, setAlwaysRules] = useState(system.alwaysRules.join("\n"));
  const [neverRules, setNeverRules] = useState(system.neverRules.join("\n"));
  const [signaturePieces, setSignaturePieces] = useState(system.signaturePieces.join("\n"));
  const [vibeReferences, setVibeReferences] = useState(system.vibeReferences.join("\n"));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const parsedPalette = textToPalette(palette);
    if (parsedPalette.length === 0) {
      setSaving(false);
      setMessage("Add at least one palette swatch as Name|#hex");
      return;
    }

    const res = await fetch("/api/style/system", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manifesto,
        palette: parsedPalette,
        silhouettes: linesToList(silhouettes),
        fabrics: linesToList(fabrics),
        alwaysRules: linesToList(alwaysRules),
        neverRules: linesToList(neverRules),
        signaturePieces: linesToList(signaturePieces),
        vibeReferences: linesToList(vibeReferences),
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
        <label>Palette (one per line: Name|#hex)</label>
        <textarea
          rows={4}
          value={palette}
          onChange={(e) => setPalette(e.target.value)}
          placeholder={"Ink|#1a1a1a\nStone|#c4bdb4"}
        />
      </div>
      <div className="field">
        <label>Silhouettes (one per line)</label>
        <textarea rows={3} value={silhouettes} onChange={(e) => setSilhouettes(e.target.value)} />
      </div>
      <div className="field">
        <label>Fabrics (one per line)</label>
        <textarea rows={3} value={fabrics} onChange={(e) => setFabrics(e.target.value)} />
      </div>
      <div className="field">
        <label>Always rules (one per line)</label>
        <textarea rows={4} value={alwaysRules} onChange={(e) => setAlwaysRules(e.target.value)} />
      </div>
      <div className="field">
        <label>Never rules (one per line)</label>
        <textarea rows={4} value={neverRules} onChange={(e) => setNeverRules(e.target.value)} />
      </div>
      <div className="field">
        <label>Signature pieces (one per line)</label>
        <textarea
          rows={3}
          value={signaturePieces}
          onChange={(e) => setSignaturePieces(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Vibe references (one per line)</label>
        <textarea
          rows={3}
          value={vibeReferences}
          onChange={(e) => setVibeReferences(e.target.value)}
        />
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
