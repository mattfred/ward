"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LifeEvent, StyleProfileInput } from "@/lib/types";

const AESTHETICS = [
  "modern classic",
  "quiet luxury",
  "utilitarian",
  "creative professional",
  "relaxed tailored",
  "minimal outdoor",
];

const COLORS = ["navy", "charcoal", "cream", "olive", "camel", "burgundy", "stone", "black", "white", "denim"];
const VALUES = ["quality", "versatility", "comfort", "polish", "sustainability", "ease"];

const DEFAULT_EVENTS: LifeEvent[] = [
  { id: "work", name: "Work week", frequency: "5x / week", dressCode: "smart casual", priority: 1 },
  { id: "weekend", name: "Weekends", frequency: "2x / week", dressCode: "intentional casual", priority: 2 },
  { id: "social", name: "Dinner / social", frequency: "2x / month", dressCode: "elevated", priority: 3 },
  { id: "travel", name: "Travel", frequency: "monthly", dressCode: "packable polished", priority: 4 },
];

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aestheticRefs, setAestheticRefs] = useState<string[]>(["modern classic"]);
  const [preferredColors, setPreferredColors] = useState<string[]>(["navy", "charcoal", "cream"]);
  const [avoidColors, setAvoidColors] = useState<string[]>([]);
  const [fitPreferences, setFitPreferences] = useState({
    tops: "structured but easy",
    bottoms: "straight / tapered",
    overall: "clean tailored lines",
  });
  const [climate, setClimate] = useState("four seasons");
  const [budgetTier, setBudgetTier] = useState<"low" | "mid" | "high">("mid");
  const [trustedBrands, setTrustedBrands] = useState("");
  const [values, setValues] = useState<string[]>(["versatility", "polish"]);
  const [notes, setNotes] = useState("");
  const [events, setEvents] = useState<LifeEvent[]>(DEFAULT_EVENTS);
  const [primaryEventId, setPrimaryEventId] = useState("work");

  const profile: StyleProfileInput = useMemo(
    () => ({
      aestheticRefs,
      preferredColors,
      avoidColors,
      fitPreferences,
      climate,
      budgetTier,
      trustedBrands: trustedBrands
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      values,
      notes,
    }),
    [
      aestheticRefs,
      preferredColors,
      avoidColors,
      fitPreferences,
      climate,
      budgetTier,
      trustedBrands,
      values,
      notes,
    ],
  );

  async function finish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, events, primaryEventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Onboarding failed");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell" style={{ padding: "2rem 0 4rem", maxWidth: 760 }}>
      <p className="display" style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>
        Ward
      </p>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Step {step + 1} of 3 — identity before inventory.
      </p>

      <div className="card-surface" style={{ padding: "1.4rem", marginTop: "1rem" }}>
        {step === 0 && (
          <div style={{ display: "grid", gap: "1.1rem" }}>
            <h1 className="display" style={{ margin: 0, fontSize: "2rem" }}>
              Who are you?
            </h1>
            <div>
              <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Aesthetic references</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {AESTHETICS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="chip"
                    data-on={aestheticRefs.includes(a)}
                    onClick={() => setAestheticRefs(toggle(aestheticRefs, a))}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Colors that feel like you</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="chip"
                    data-on={preferredColors.includes(c)}
                    onClick={() => setPreferredColors(toggle(preferredColors, c))}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Colors to avoid</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="chip"
                    data-on={avoidColors.includes(c)}
                    onClick={() => setAvoidColors(toggle(avoidColors, c))}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>What you value</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {VALUES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className="chip"
                    data-on={values.includes(v)}
                    onClick={() => setValues(toggle(values, v))}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <h1 className="display" style={{ margin: 0, fontSize: "2rem" }}>
              How do you live?
            </h1>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              Pick your primary context. Free includes one lifestyle blueprint; Premium unlocks all.
            </p>
            {events.map((ev) => (
              <label
                key={ev.id}
                className="card-surface"
                style={{
                  padding: "0.9rem 1rem",
                  display: "grid",
                  gap: "0.35rem",
                  borderColor: primaryEventId === ev.id ? "var(--moss)" : "var(--line)",
                  background: primaryEventId === ev.id ? "rgba(47,93,74,0.08)" : "rgba(255,255,255,0.45)",
                }}
              >
                <span style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="primary"
                    checked={primaryEventId === ev.id}
                    onChange={() => setPrimaryEventId(ev.id)}
                  />
                  <strong>{ev.name}</strong>
                </span>
                <span style={{ color: "var(--ink-soft)", fontSize: "0.92rem" }}>
                  {ev.frequency} · {ev.dressCode}
                </span>
                <input
                  value={ev.dressCode}
                  onChange={(e) =>
                    setEvents((prev) =>
                      prev.map((p) => (p.id === ev.id ? { ...p, dressCode: e.target.value } : p)),
                    )
                  }
                  aria-label={`${ev.name} dress code`}
                />
              </label>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <h1 className="display" style={{ margin: 0, fontSize: "2rem" }}>
              Fit, climate, budget
            </h1>
            <div className="field">
              <label>Overall silhouette</label>
              <input
                value={fitPreferences.overall}
                onChange={(e) => setFitPreferences({ ...fitPreferences, overall: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Tops</label>
              <input
                value={fitPreferences.tops}
                onChange={(e) => setFitPreferences({ ...fitPreferences, tops: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Bottoms</label>
              <input
                value={fitPreferences.bottoms}
                onChange={(e) => setFitPreferences({ ...fitPreferences, bottoms: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Climate</label>
              <input value={climate} onChange={(e) => setClimate(e.target.value)} />
            </div>
            <div className="field">
              <label>Budget tier</label>
              <select
                value={budgetTier}
                onChange={(e) => setBudgetTier(e.target.value as "low" | "mid" | "high")}
              >
                <option value="low">Low — careful buys</option>
                <option value="mid">Mid — quality staples</option>
                <option value="high">High — invest in anchors</option>
              </select>
            </div>
            <div className="field">
              <label>Trusted brands (comma separated)</label>
              <input
                value={trustedBrands}
                onChange={(e) => setTrustedBrands(e.target.value)}
                placeholder="e.g. Everlane, Uniqlo, A.P.C."
              />
            </div>
            <div className="field">
              <label>Anything else?</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        )}

        {error ? <p style={{ color: "#9b2c2c" }}>{error}</p> : null}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.4rem", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={step === 0 || loading}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          {step < 2 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={aestheticRefs.length === 0 || preferredColors.length === 0}
            >
              Continue
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={finish} disabled={loading}>
              {loading ? "Architecting…" : "Generate my system"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
