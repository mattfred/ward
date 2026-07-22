"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Target = "system" | "blueprint" | "roadmap" | "all";

const LABELS: Record<Target, string> = {
  all: "everything",
  system: "your style system",
  blueprint: "your wardrobe blueprint",
  roadmap: "your rebuild roadmap",
};

const SECTION_IDS: Record<Target, string> = {
  all: "style-system",
  system: "style-system",
  blueprint: "wardrobe-blueprint",
  roadmap: "rebuild-roadmap",
};

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("regen-flash");
  window.setTimeout(() => el.classList.remove("regen-flash"), 1600);
}

export function RegenerateControls() {
  const router = useRouter();
  const [loading, setLoading] = useState<Target | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function run(target: Target) {
    setLoading(target);
    setError(null);
    setToast(null);
    try {
      const res = await fetch("/api/style/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regenerate failed");

      setToast(`Updated ${LABELS[target]}. Jumping there now…`);
      router.refresh();
      window.setTimeout(() => scrollToSection(SECTION_IDS[target]), 280);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        <button
          className="btn btn-ghost"
          disabled={!!loading}
          onClick={() => void run("all")}
          style={{ padding: "0.55rem 1rem" }}
          aria-busy={loading === "all"}
        >
          {loading === "all" ? "Working…" : "Regenerate all"}
        </button>
        <button
          className="btn btn-ghost"
          disabled={!!loading}
          onClick={() => void run("system")}
          style={{ padding: "0.55rem 1rem" }}
          aria-busy={loading === "system"}
        >
          {loading === "system" ? "Working…" : "System"}
        </button>
        <button
          className="btn btn-ghost"
          disabled={!!loading}
          onClick={() => void run("blueprint")}
          style={{ padding: "0.55rem 1rem" }}
          aria-busy={loading === "blueprint"}
        >
          {loading === "blueprint" ? "Working…" : "Blueprint"}
        </button>
        <button
          className="btn btn-ghost"
          disabled={!!loading}
          onClick={() => void run("roadmap")}
          style={{ padding: "0.55rem 1rem" }}
          aria-busy={loading === "roadmap"}
        >
          {loading === "roadmap" ? "Working…" : "Roadmap"}
        </button>
        {error ? <span style={{ color: "#9b2c2c", fontSize: "0.9rem" }}>{error}</span> : null}
      </div>

      {loading ? (
        <div className="regen-overlay" role="status" aria-live="polite">
          <div className="regen-modal card-surface">
            <p className="display" style={{ margin: 0, fontSize: "1.55rem" }}>
              Regenerating {LABELS[loading]}
            </p>
            <p style={{ color: "var(--ink-soft)", margin: "0.65rem 0 0" }}>
              Ward is rewriting this layer from your profile and style memory. This can take a few
              seconds.
            </p>
            <div className="regen-spinner" aria-hidden />
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="regen-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </>
  );
}
