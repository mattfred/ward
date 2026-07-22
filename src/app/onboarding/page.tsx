"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LifeEvent, StyleProfileInput } from "@/lib/types";
import {
  AESTHETICS,
  AGE_RANGES,
  CLOSET_HONESTY,
  COLORS,
  CONSTRAINTS,
  DEFAULT_EVENTS,
  FORMALITY,
  GENDER_OPTIONS,
  HEIGHT_BANDS,
  VALUES,
  buildFallbackCoach,
  emptyProfile,
  profileReadyForGenerate,
  type CoachResponse,
} from "@/lib/intake";
import { ChipPicker } from "@/components/ChipPicker";
import { CoachPanel } from "@/components/CoachPanel";

const GUIDED_STEPS = [
  { id: "identity", title: "Who are you dressing as?" },
  { id: "life", title: "How do you live?" },
  { id: "inspiration", title: "What are you drawn to?" },
  { id: "colors", title: "Palette & values" },
  { id: "body", title: "Fit & comfort" },
  { id: "constraints", title: "Real-world constraints" },
  { id: "closet", title: "Honest closet check" },
] as const;

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"guided" | "studio">("guided");
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StyleProfileInput>(() => ({
    ...emptyProfile(),
    preferredColors: ["navy", "charcoal", "cream"],
    values: ["versatility", "polish"],
    climate: "four seasons / temperate city",
    fitPreferences: {
      overall: "clean tailored lines",
      tops: "structured but easy",
      bottoms: "straight / tapered",
    },
    intakeMode: "guided",
  }));
  const [events, setEvents] = useState<LifeEvent[]>(DEFAULT_EVENTS);
  const [primaryEventId, setPrimaryEventId] = useState("work");
  const [brandsText, setBrandsText] = useState("");
  const [coachResult, setCoachResult] = useState<{
    key: string;
    data: CoachResponse;
  } | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  const step = GUIDED_STEPS[stepIndex];

  const patchProfile = useCallback((patch: Partial<StyleProfileInput>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const aestheticKey = profile.aestheticRefs.join("|");
  const inspirationKey = (profile.inspirationRefs ?? []).join("|");
  const colorKey = profile.preferredColors.join("|");
  const coachKey = [
    mode,
    stepIndex,
    profile.genderPresentation ?? "",
    aestheticKey,
    inspirationKey,
    profile.formalityRange,
    profile.closetHonesty,
    colorKey,
  ].join("::");

  const coachFallback = useMemo(() => {
    if (mode !== "guided") return null;
    return buildFallbackCoach(profile, GUIDED_STEPS[stepIndex].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce-friendly keys only
  }, [coachKey]);

  const displayedCoach =
    coachResult?.key === coachKey ? coachResult.data : coachFallback;

  useEffect(() => {
    if (mode !== "guided") return;
    const stepId = GUIDED_STEPS[stepIndex].id;
    const requestKey = coachKey;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setCoachLoading(true);
      try {
        const res = await fetch("/api/onboarding/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: stepId, profile }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as CoachResponse;
        if (!cancelled) setCoachResult({ key: requestKey, data });
      } catch {
        // keep fallback via displayedCoach
      } finally {
        if (!cancelled) setCoachLoading(false);
      }
    }, 650);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
    // Intentionally depend on step + a few key fields, not every keystroke on bodyNotes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachKey]);

  const canContinue = useMemo(() => {
    if (mode === "studio") return profileReadyForGenerate(profile);
    switch (step.id) {
      case "identity":
        return true;
      case "life":
        return Boolean(primaryEventId);
      case "inspiration":
        return (
          profile.aestheticRefs.length > 0 || (profile.inspirationRefs?.length ?? 0) > 0
        );
      case "colors":
        return profile.preferredColors.length > 0;
      case "body":
        return Boolean(
          profile.fitPreferences.overall.trim() || profile.bodyNotes?.trim(),
        );
      case "constraints":
        return Boolean(profile.climate.trim());
      case "closet":
        return profileReadyForGenerate(profile);
      default:
        return true;
    }
  }, [mode, step.id, profile, primaryEventId]);

  function applyCoachChip(chip: string) {
    const id = step.id;
    if (id === "identity") {
      patchProfile({ aestheticRefs: toggle(profile.aestheticRefs, chip) });
      return;
    }
    if (id === "inspiration") {
      if (AESTHETICS.includes(chip)) {
        patchProfile({ aestheticRefs: toggle(profile.aestheticRefs, chip) });
      } else {
        patchProfile({
          inspirationRefs: toggle(profile.inspirationRefs || [], chip),
        });
      }
      return;
    }
    if (id === "colors") {
      if (VALUES.includes(chip)) {
        patchProfile({ values: toggle(profile.values, chip) });
      } else if (COLORS.includes(chip)) {
        patchProfile({ preferredColors: toggle(profile.preferredColors, chip) });
      } else {
        patchProfile({ values: toggle(profile.values, chip) });
      }
      return;
    }
    if (id === "body") {
      const next = profile.bodyNotes?.trim()
        ? `${profile.bodyNotes.trim()}; ${chip}`
        : chip;
      patchProfile({ bodyNotes: next });
      return;
    }
    if (id === "life") {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === primaryEventId ? { ...ev, dressCode: chip } : ev,
        ),
      );
      return;
    }
    patchProfile({ values: toggle(profile.values, chip) });
  }

  async function finish() {
    setLoading(true);
    setError(null);
    try {
      const payloadProfile: StyleProfileInput = {
        ...profile,
        trustedBrands: brandsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        intakeMode: mode,
      };
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: payloadProfile,
          events,
          primaryEventId,
        }),
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
    <main className="shell" style={{ padding: "2rem 0 4rem", maxWidth: 820 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p className="display" style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>
            Ward
          </p>
          <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
            {mode === "guided"
              ? `Guided · step ${stepIndex + 1} of ${GUIDED_STEPS.length}`
              : "Studio · full control"}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setMode((m) => {
              const next = m === "guided" ? "studio" : "guided";
              setProfile((prev) => ({ ...prev, intakeMode: next }));
              return next;
            });
            setStepIndex(0);
            setCoachResult(null);
          }}
        >
          {mode === "guided" ? "Switch to Studio" : "Switch to Guided"}
        </button>
      </div>

      <div className="card-surface" style={{ padding: "1.4rem", marginTop: "1rem" }}>
        {mode === "guided" ? (
          <GuidedStep
            stepId={step.id}
            title={step.title}
            profile={profile}
            events={events}
            primaryEventId={primaryEventId}
            brandsText={brandsText}
            onBrandsText={setBrandsText}
            onPatch={patchProfile}
            onEvents={setEvents}
            onPrimary={setPrimaryEventId}
          />
        ) : (
          <StudioForm
            profile={profile}
            events={events}
            primaryEventId={primaryEventId}
            brandsText={brandsText}
            onBrandsText={setBrandsText}
            onPatch={patchProfile}
            onEvents={setEvents}
            onPrimary={setPrimaryEventId}
          />
        )}

        {mode === "guided" ? (
          <CoachPanel coach={displayedCoach} loading={coachLoading} onApplyChip={applyCoachChip} />
        ) : null}

        {error ? <p style={{ color: "#9b2c2c" }}>{error}</p> : null}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "1.4rem",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            disabled={loading || (mode === "guided" && stepIndex === 0)}
            onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          {mode === "guided" && stepIndex < GUIDED_STEPS.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStepIndex((s) => s + 1)}
              disabled={!canContinue}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={finish}
              disabled={loading || !canContinue}
            >
              {loading ? "Architecting…" : "Generate my system"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function GuidedStep(props: {
  stepId: string;
  title: string;
  profile: StyleProfileInput;
  events: LifeEvent[];
  primaryEventId: string;
  brandsText: string;
  onBrandsText: (v: string) => void;
  onPatch: (patch: Partial<StyleProfileInput>) => void;
  onEvents: (events: LifeEvent[]) => void;
  onPrimary: (id: string) => void;
}) {
  const { stepId, title, profile, events, primaryEventId, onPatch, onEvents, onPrimary } =
    props;

  return (
    <div style={{ display: "grid", gap: "1.1rem" }}>
      <h1 className="display" style={{ margin: 0, fontSize: "2rem" }}>
        {title}
      </h1>

      {stepId === "identity" ? (
        <>
          <OptionalSelect
            label="Gender presentation (optional)"
            value={profile.genderPresentation || ""}
            options={GENDER_OPTIONS}
            onChange={(v) => onPatch({ genderPresentation: v })}
          />
          <OptionalSelect
            label="Age range (optional)"
            value={profile.ageRange || ""}
            options={AGE_RANGES}
            onChange={(v) => onPatch({ ageRange: v })}
          />
          <Field label="Aesthetic directions (optional for now)">
            <ChipPicker
              options={AESTHETICS}
              selected={profile.aestheticRefs}
              onToggle={(v) => onPatch({ aestheticRefs: toggle(profile.aestheticRefs, v) })}
            />
          </Field>
        </>
      ) : null}

      {stepId === "life" ? (
        <>
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
                background:
                  primaryEventId === ev.id ? "rgba(47,93,74,0.08)" : "rgba(255,255,255,0.45)",
              }}
            >
              <span style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <input
                  type="radio"
                  name="primary"
                  checked={primaryEventId === ev.id}
                  onChange={() => onPrimary(ev.id)}
                />
                <strong>{ev.name}</strong>
              </span>
              <span style={{ color: "var(--ink-soft)", fontSize: "0.92rem" }}>
                {ev.frequency} · {ev.dressCode}
              </span>
              <input
                value={ev.dressCode}
                onChange={(e) =>
                  onEvents(
                    events.map((p) =>
                      p.id === ev.id ? { ...p, dressCode: e.target.value } : p,
                    ),
                  )
                }
                aria-label={`${ev.name} dress code`}
              />
            </label>
          ))}
          <Field label="Formality range">
            <ChipPicker
              options={[...FORMALITY]}
              selected={profile.formalityRange ? [profile.formalityRange] : []}
              onToggle={(v) =>
                onPatch({ formalityRange: profile.formalityRange === v ? "" : v })
              }
            />
          </Field>
        </>
      ) : null}

      {stepId === "inspiration" ? (
        <>
          <Field label="Inspiration — brands, people, scenes">
            <ChipPicker
              options={["Everlane", "COS", "Uniqlo U", "A.P.C.", "The Row vibe", "Scandi street"]}
              selected={profile.inspirationRefs || []}
              onToggle={(v) =>
                onPatch({ inspirationRefs: toggle(profile.inspirationRefs || [], v) })
              }
              allowCustom
              onAddCustom={(v) =>
                onPatch({ inspirationRefs: toggle(profile.inspirationRefs || [], v) })
              }
            />
          </Field>
          <Field label="Hard avoids">
            <ChipPicker
              options={["loud logos", "skinny everything", "itchy wool", "neon", "heels all day"]}
              selected={profile.antiRefs || []}
              onToggle={(v) => onPatch({ antiRefs: toggle(profile.antiRefs || [], v) })}
              allowCustom
              onAddCustom={(v) => onPatch({ antiRefs: toggle(profile.antiRefs || [], v) })}
            />
          </Field>
          <Field label="Aesthetic labels">
            <ChipPicker
              options={AESTHETICS}
              selected={profile.aestheticRefs}
              onToggle={(v) => onPatch({ aestheticRefs: toggle(profile.aestheticRefs, v) })}
            />
          </Field>
        </>
      ) : null}

      {stepId === "colors" ? (
        <>
          <Field label="Colors that feel like you">
            <ChipPicker
              options={COLORS}
              selected={profile.preferredColors}
              onToggle={(v) =>
                onPatch({ preferredColors: toggle(profile.preferredColors, v) })
              }
            />
          </Field>
          <Field label="Colors to avoid">
            <ChipPicker
              options={COLORS}
              selected={profile.avoidColors}
              onToggle={(v) => onPatch({ avoidColors: toggle(profile.avoidColors, v) })}
            />
          </Field>
          <Field label="What you value">
            <ChipPicker
              options={VALUES}
              selected={profile.values}
              onToggle={(v) => onPatch({ values: toggle(profile.values, v) })}
            />
          </Field>
        </>
      ) : null}

      {stepId === "body" ? (
        <>
          <OptionalSelect
            label="Height band (optional)"
            value={profile.heightBand || ""}
            options={HEIGHT_BANDS}
            onChange={(v) => onPatch({ heightBand: v })}
          />
          <div className="field">
            <label>Body / fit notes</label>
            <textarea
              rows={3}
              value={profile.bodyNotes || ""}
              onChange={(e) => onPatch({ bodyNotes: e.target.value })}
              placeholder="e.g. long torso, prefer soft structure, avoid tight thighs"
            />
          </div>
          <div className="field">
            <label>Overall silhouette</label>
            <input
              value={profile.fitPreferences.overall}
              onChange={(e) =>
                onPatch({
                  fitPreferences: { ...profile.fitPreferences, overall: e.target.value },
                })
              }
            />
          </div>
          <div className="field">
            <label>Tops</label>
            <input
              value={profile.fitPreferences.tops}
              onChange={(e) =>
                onPatch({
                  fitPreferences: { ...profile.fitPreferences, tops: e.target.value },
                })
              }
            />
          </div>
          <div className="field">
            <label>Bottoms</label>
            <input
              value={profile.fitPreferences.bottoms}
              onChange={(e) =>
                onPatch({
                  fitPreferences: { ...profile.fitPreferences, bottoms: e.target.value },
                })
              }
            />
          </div>
        </>
      ) : null}

      {stepId === "constraints" ? (
        <>
          <div className="field">
            <label>Climate / city</label>
            <input
              value={profile.climate}
              onChange={(e) => onPatch({ climate: e.target.value })}
              placeholder="e.g. NYC four seasons, humid summers"
            />
          </div>
          <Field label="Constraints">
            <ChipPicker
              options={[...CONSTRAINTS]}
              selected={profile.constraints || []}
              onToggle={(v) => onPatch({ constraints: toggle(profile.constraints || [], v) })}
            />
          </Field>
          <div className="field">
            <label>Budget tier</label>
            <select
              value={profile.budgetTier}
              onChange={(e) =>
                onPatch({ budgetTier: e.target.value as StyleProfileInput["budgetTier"] })
              }
            >
              <option value="low">Low — careful buys</option>
              <option value="mid">Mid — quality staples</option>
              <option value="high">High — invest in anchors</option>
            </select>
          </div>
          <div className="field">
            <label>Trusted brands (comma separated)</label>
            <input
              value={props.brandsText}
              onChange={(e) => props.onBrandsText(e.target.value)}
              placeholder="e.g. Everlane, Uniqlo, A.P.C."
            />
          </div>
        </>
      ) : null}

      {stepId === "closet" ? (
        <>
          <Field label="Where is your closet today?">
            <ChipPicker
              options={[...CLOSET_HONESTY]}
              selected={profile.closetHonesty ? [profile.closetHonesty] : []}
              onToggle={(v) =>
                onPatch({ closetHonesty: profile.closetHonesty === v ? "" : v })
              }
            />
          </Field>
          <div className="field">
            <label>Anything else?</label>
            <textarea
              rows={3}
              value={profile.notes || ""}
              onChange={(e) => onPatch({ notes: e.target.value })}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function StudioForm(props: {
  profile: StyleProfileInput;
  events: LifeEvent[];
  primaryEventId: string;
  brandsText: string;
  onBrandsText: (v: string) => void;
  onPatch: (patch: Partial<StyleProfileInput>) => void;
  onEvents: (events: LifeEvent[]) => void;
  onPrimary: (id: string) => void;
}) {
  const { profile, events, primaryEventId, onPatch, onEvents, onPrimary } = props;
  return (
    <div style={{ display: "grid", gap: "1.1rem" }}>
      <h1 className="display" style={{ margin: 0, fontSize: "2rem" }}>
        Studio intake
      </h1>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Edit everything at once. Gender presentation stays optional.
      </p>
      <OptionalSelect
        label="Gender presentation (optional)"
        value={profile.genderPresentation || ""}
        options={GENDER_OPTIONS}
        onChange={(v) => onPatch({ genderPresentation: v })}
      />
      <OptionalSelect
        label="Age range (optional)"
        value={profile.ageRange || ""}
        options={AGE_RANGES}
        onChange={(v) => onPatch({ ageRange: v })}
      />
      <Field label="Aesthetics">
        <ChipPicker
          options={AESTHETICS}
          selected={profile.aestheticRefs}
          onToggle={(v) => onPatch({ aestheticRefs: toggle(profile.aestheticRefs, v) })}
        />
      </Field>
      <Field label="Inspiration">
        <ChipPicker
          options={["Everlane", "COS", "Uniqlo U", "A.P.C."]}
          selected={profile.inspirationRefs || []}
          onToggle={(v) =>
            onPatch({ inspirationRefs: toggle(profile.inspirationRefs || [], v) })
          }
          allowCustom
          onAddCustom={(v) =>
            onPatch({ inspirationRefs: toggle(profile.inspirationRefs || [], v) })
          }
        />
      </Field>
      <Field label="Hard avoids">
        <ChipPicker
          options={["loud logos", "skinny everything", "itchy wool"]}
          selected={profile.antiRefs || []}
          onToggle={(v) => onPatch({ antiRefs: toggle(profile.antiRefs || [], v) })}
          allowCustom
          onAddCustom={(v) => onPatch({ antiRefs: toggle(profile.antiRefs || [], v) })}
        />
      </Field>
      <Field label="Preferred colors">
        <ChipPicker
          options={COLORS}
          selected={profile.preferredColors}
          onToggle={(v) => onPatch({ preferredColors: toggle(profile.preferredColors, v) })}
        />
      </Field>
      <Field label="Avoid colors">
        <ChipPicker
          options={COLORS}
          selected={profile.avoidColors}
          onToggle={(v) => onPatch({ avoidColors: toggle(profile.avoidColors, v) })}
        />
      </Field>
      <Field label="Values">
        <ChipPicker
          options={VALUES}
          selected={profile.values}
          onToggle={(v) => onPatch({ values: toggle(profile.values, v) })}
        />
      </Field>
      <Field label="Formality">
        <ChipPicker
          options={[...FORMALITY]}
          selected={profile.formalityRange ? [profile.formalityRange] : []}
          onToggle={(v) => onPatch({ formalityRange: profile.formalityRange === v ? "" : v })}
        />
      </Field>
      <OptionalSelect
        label="Height band (optional)"
        value={profile.heightBand || ""}
        options={HEIGHT_BANDS}
        onChange={(v) => onPatch({ heightBand: v })}
      />
      <div className="field">
        <label>Body notes</label>
        <textarea
          rows={2}
          value={profile.bodyNotes || ""}
          onChange={(e) => onPatch({ bodyNotes: e.target.value })}
        />
      </div>
      <div className="field">
        <label>Overall / tops / bottoms</label>
        <input
          value={profile.fitPreferences.overall}
          onChange={(e) =>
            onPatch({ fitPreferences: { ...profile.fitPreferences, overall: e.target.value } })
          }
          placeholder="Overall"
        />
        <input
          style={{ marginTop: "0.45rem" }}
          value={profile.fitPreferences.tops}
          onChange={(e) =>
            onPatch({ fitPreferences: { ...profile.fitPreferences, tops: e.target.value } })
          }
          placeholder="Tops"
        />
        <input
          style={{ marginTop: "0.45rem" }}
          value={profile.fitPreferences.bottoms}
          onChange={(e) =>
            onPatch({
              fitPreferences: { ...profile.fitPreferences, bottoms: e.target.value },
            })
          }
          placeholder="Bottoms"
        />
      </div>
      <div className="field">
        <label>Climate</label>
        <input value={profile.climate} onChange={(e) => onPatch({ climate: e.target.value })} />
      </div>
      <Field label="Constraints">
        <ChipPicker
          options={[...CONSTRAINTS]}
          selected={profile.constraints || []}
          onToggle={(v) => onPatch({ constraints: toggle(profile.constraints || [], v) })}
        />
      </Field>
      <div className="field">
        <label>Budget</label>
        <select
          value={profile.budgetTier}
          onChange={(e) =>
            onPatch({ budgetTier: e.target.value as StyleProfileInput["budgetTier"] })
          }
        >
          <option value="low">Low</option>
          <option value="mid">Mid</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="field">
        <label>Trusted brands</label>
        <input value={props.brandsText} onChange={(e) => props.onBrandsText(e.target.value)} />
      </div>
      <Field label="Closet honesty">
        <ChipPicker
          options={[...CLOSET_HONESTY]}
          selected={profile.closetHonesty ? [profile.closetHonesty] : []}
          onToggle={(v) => onPatch({ closetHonesty: profile.closetHonesty === v ? "" : v })}
        />
      </Field>
      <div className="field">
        <label>Notes</label>
        <textarea
          rows={3}
          value={profile.notes || ""}
          onChange={(e) => onPatch({ notes: e.target.value })}
        />
      </div>
      <div>
        <p style={{ fontWeight: 600 }}>Life map · primary event</p>
        {events.map((ev) => (
          <label key={ev.id} style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
            <input
              type="radio"
              checked={primaryEventId === ev.id}
              onChange={() => onPrimary(ev.id)}
            />
            {ev.name}
            <input
              value={ev.dressCode}
              onChange={(e) =>
                onEvents(
                  events.map((p) => (p.id === ev.id ? { ...p, dressCode: e.target.value } : p)),
                )
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{label}</p>
      {children}
    </div>
  );
}

function OptionalSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Skip</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
