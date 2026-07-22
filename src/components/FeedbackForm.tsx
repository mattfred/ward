"use client";

import { useState } from "react";

export function FeedbackForm() {
  const [cohesive, setCohesive] = useState(4);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cohesive, comment }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not save feedback");
      return;
    }
    setDone(true);
  }

  if (done) {
    return <p style={{ color: "var(--moss-deep)", fontWeight: 600 }}>Thanks — that helps shape Cohesive.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem", maxWidth: 520 }}>
      <label className="field">
        Cohesion score (1–5)
        <input
          type="range"
          min={1}
          max={5}
          value={cohesive}
          onChange={(e) => setCohesive(Number(e.target.value))}
        />
        <span>{cohesive}</span>
      </label>
      <textarea
        rows={3}
        placeholder="What feels clearer? What’s still noisy?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error ? <p style={{ color: "#9b2c2c", margin: 0 }}>{error}</p> : null}
      <button className="btn btn-primary" onClick={submit} style={{ justifySelf: "start" }}>
        Submit feedback
      </button>
    </div>
  );
}
