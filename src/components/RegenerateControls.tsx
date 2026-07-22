"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegenerateControls() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(target: "system" | "blueprint" | "roadmap" | "all") {
    setLoading(target);
    setError(null);
    try {
      const res = await fetch("/api/style/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regenerate failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
      <button className="btn btn-ghost" disabled={!!loading} onClick={() => run("all")} style={{ padding: "0.55rem 1rem" }}>
        {loading === "all" ? "Regenerating…" : "Regenerate all"}
      </button>
      <button className="btn btn-ghost" disabled={!!loading} onClick={() => run("system")} style={{ padding: "0.55rem 1rem" }}>
        System
      </button>
      <button className="btn btn-ghost" disabled={!!loading} onClick={() => run("blueprint")} style={{ padding: "0.55rem 1rem" }}>
        Blueprint
      </button>
      <button className="btn btn-ghost" disabled={!!loading} onClick={() => run("roadmap")} style={{ padding: "0.55rem 1rem" }}>
        Roadmap
      </button>
      {error ? <span style={{ color: "#9b2c2c", fontSize: "0.9rem" }}>{error}</span> : null}
    </div>
  );
}
