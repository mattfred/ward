import OpenAI from "openai";
import type {
  BlueprintPiece,
  LifeEvent,
  PurchaseFitResult,
  RoadmapItem,
  StyleProfileInput,
  StyleSystemData,
} from "./types";

const COLOR_HEX: Record<string, string> = {
  navy: "#1B2A4A",
  charcoal: "#36454F",
  black: "#111111",
  white: "#F7F5F2",
  cream: "#F5EDE0",
  olive: "#556B2F",
  camel: "#C19A6B",
  burgundy: "#6B2D3C",
  forest: "#1E3A2F",
  stone: "#A8A29E",
  denim: "#3B5B7A",
  taupe: "#8B7E74",
  rust: "#A65D3F",
  slate: "#64748B",
};

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function pickPalette(preferred: string[]): StyleSystemData["palette"] {
  const base = preferred.length
    ? preferred
    : ["navy", "charcoal", "cream", "olive", "stone"];
  const unique = [...new Set(base.map((c) => c.toLowerCase()))].slice(0, 6);
  return unique.map((name) => ({
    name,
    hex: COLOR_HEX[name] ?? "#6B7280",
  }));
}

export function buildFallbackStyleSystem(
  profile: StyleProfileInput,
  events: LifeEvent[],
): StyleSystemData {
  const primary = events.sort((a, b) => a.priority - b.priority)[0];
  const refs =
    profile.aestheticRefs.slice(0, 4).join(", ") ||
    profile.inspirationRefs?.slice(0, 3).join(", ") ||
    "clean modern classics";
  const values = profile.values.slice(0, 3).join(", ") || "intentional dressing";
  const presentation = profile.genderPresentation?.trim();
  const formality = profile.formalityRange || "smart casual";

  return {
    manifesto: `You dress with intention around ${refs}${
      presentation ? ` (${presentation.toLowerCase()} wardrobe)` : ""
    }. Your wardrobe should feel cohesive across ${primary?.name ?? "everyday life"} and beyond — fewer louder pieces, more repeating silhouettes and a restrained palette so every outfit reads as you. Formality baseline: ${formality}. You value ${values}.`,
    palette: pickPalette(profile.preferredColors),
    silhouettes: [
      profile.fitPreferences.overall || profile.bodyNotes || "clean tailored lines",
      profile.fitPreferences.tops || "structured but comfortable tops",
      profile.fitPreferences.bottoms || "straight or gently tapered bottoms",
    ],
    fabrics: ["wool blend", "cotton twill", "merino", "washed linen", "soft denim"].slice(
      0,
      profile.climate?.toLowerCase().includes("hot") ? 5 : 4,
    ),
    alwaysRules: [
      "Repeat the same silhouette language across occasions",
      "Stay inside your core palette unless an accent is intentional",
      "Prefer versatile pieces that unlock multiple outfits",
      ...(profile.values.includes("quality")
        ? ["Buy fewer, better pieces with clear cost-per-wear"]
        : []),
      ...(profile.constraints?.includes("Need machine-washable only")
        ? ["Prefer machine-washable fabrics for weekly rotation"]
        : []),
    ].slice(0, 6),
    neverRules: [
      ...(profile.avoidColors.length
        ? [`Avoid dominant ${profile.avoidColors.join(", ")} unless tiny accents`]
        : ["Avoid trend-only pieces that ignore your silhouette rules"]),
      ...(profile.antiRefs?.length
        ? profile.antiRefs.slice(0, 2).map((a) => `Avoid ${a}`)
        : ["No one-off statement items that only work once"]),
      "Don't expand the wardrobe before finishing core gaps",
    ].slice(0, 5),
    signaturePieces: [
      `A ${profile.preferredColors[0] || "navy"} layer that anchors most looks`,
      "A reliable bottom that pairs with every top in the system",
      "One elevated shoe that upgrades casual and work outfits",
    ],
    vibeReferences: profile.aestheticRefs.length
      ? profile.aestheticRefs
      : profile.inspirationRefs?.length
        ? profile.inspirationRefs
        : ["quiet luxury", "modern classic", "intentional casual"],
  };
}

export function buildFallbackBlueprint(
  system: StyleSystemData,
  events: LifeEvent[],
): BlueprintPiece[] {
  const categories = [
    { category: "Tops", names: ["Primary knit", "Crisp shirt", "Layering tee"] },
    { category: "Bottoms", names: ["Core trouser", "Casual pant"] },
    { category: "Layers", names: ["Everyday jacket", "Weather shell"] },
    { category: "Shoes", names: ["Daily shoe", "Elevated shoe"] },
    { category: "Extras", names: ["Belt / finish piece"] },
  ];

  const pieces: BlueprintPiece[] = [];
  let priority = 1;

  for (const event of [...events].sort((a, b) => a.priority - b.priority)) {
    for (const cat of categories) {
      for (const name of cat.names) {
        const color = system.palette[priority % system.palette.length]?.name ?? "neutral";
        pieces.push({
          id: `${slug(event.id)}-${slug(cat.category)}-${slug(name)}`,
          eventId: event.id,
          eventName: event.name,
          category: cat.category,
          name: `${event.name} ${name}`,
          rationale: `Supports ${event.name} (${event.dressCode}) inside your ${color} palette and ${system.silhouettes[0]} silhouette.`,
          quantity: 1,
          priority: priority++,
          ownership: "not_owned",
        });
      }
    }
  }

  return pieces;
}

export function buildFallbackRoadmap(pieces: BlueprintPiece[]): {
  items: RoadmapItem[];
  weeklyFocus: string;
} {
  const sorted = [...pieces].sort((a, b) => a.priority - b.priority);
  const items: RoadmapItem[] = sorted.map((p, idx) => ({
    id: `road-${p.id}`,
    pieceId: p.id,
    title: p.name,
    reason: p.rationale,
    budgetTier: idx < 5 ? "essential" : idx < 12 ? "upgrade" : "aspirational",
    order: idx + 1,
    unlocks:
      idx === 0
        ? "Your first complete daily outfit formula"
        : `Combines with prior pieces for ${Math.min(idx + 1, 8)}+ looks`,
    done: false,
  }));

  const focus = items[0];
  return {
    items,
    weeklyFocus: focus
      ? `This week: add ${focus.title} — ${focus.unlocks}.`
      : "Complete onboarding to generate your rebuild focus.",
  };
}

export function buildFallbackPurchaseFit(
  description: string,
  system: StyleSystemData,
): PurchaseFitResult {
  const text = description.toLowerCase();
  const paletteHit = system.palette.some((p) => text.includes(p.name.toLowerCase()));
  const neverHit = system.neverRules.some((r) =>
    r.toLowerCase().split(" ").some((w) => w.length > 4 && text.includes(w)),
  );
  const silhouetteHit = system.silhouettes.some((s) =>
    s
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length > 4)
      .some((w) => text.includes(w)),
  );

  let score = 55;
  const reasons: string[] = [];
  const suggestions: string[] = [];

  if (paletteHit) {
    score += 20;
    reasons.push("Color aligns with your core palette.");
  } else {
    score -= 10;
    reasons.push("Color isn't clearly in your palette.");
    suggestions.push(`Prefer ${system.palette.map((p) => p.name).join(", ")}.`);
  }

  if (silhouetteHit) {
    score += 15;
    reasons.push("Silhouette language matches your system.");
  } else {
    reasons.push("Silhouette fit is unclear from the description.");
    suggestions.push(`Aim for: ${system.silhouettes[0]}.`);
  }

  if (neverHit) {
    score -= 25;
    reasons.push("May conflict with one of your never-rules.");
  }

  score = Math.max(0, Math.min(100, score));
  const verdict = score >= 75 ? "fits" : score >= 50 ? "stretch" : "skip";

  if (verdict !== "fits") {
    suggestions.push("Ask whether this unlocks new outfits or only duplicates what you already planned.");
  }

  return { score, verdict, reasons, suggestions };
}

async function openaiClient() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export async function generateStyleSystem(
  profile: StyleProfileInput,
  events: LifeEvent[],
): Promise<StyleSystemData> {
  const fallback = buildFallbackStyleSystem(profile, events);
  const client = await openaiClient();
  if (!client) return fallback;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a wardrobe architect. Return JSON with keys: manifesto, palette (array of {name,hex} where hex is #RRGGBB), silhouettes, fabrics, alwaysRules, neverRules, signaturePieces, vibeReferences. Use genderPresentation only if provided (optional). Respect bodyNotes, antiRefs, constraints, formalityRange, and closetHonesty. Keep advice cohesion-first, not trend-chasing.",
        },
        {
          role: "user",
          content: JSON.stringify({
            profile,
            events,
            emphasis: {
              presentation: profile.genderPresentation || null,
              inspiration: profile.inspirationRefs || [],
              avoids: [...(profile.antiRefs || []), ...profile.avoidColors],
              constraints: profile.constraints || [],
              formality: profile.formalityRange || null,
              closet: profile.closetHonesty || null,
            },
          }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as StyleSystemData;
    const normalizedPalette = (parsed.palette || [])
      .map((swatch) => {
        const hexRaw = String(swatch?.hex || "").trim();
        let hex = hexRaw.startsWith("#") ? hexRaw : hexRaw ? `#${hexRaw}` : "";
        if (/^#[0-9a-fA-F]{8}$/.test(hex)) hex = hex.slice(0, 7);
        if (!/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(hex)) return null;
        const name = String(swatch?.name || "").trim();
        if (!name) return null;
        return { name, hex: hex.toLowerCase() };
      })
      .filter((s): s is { name: string; hex: string } => Boolean(s));
    return {
      manifesto: parsed.manifesto || fallback.manifesto,
      palette: normalizedPalette.length ? normalizedPalette : fallback.palette,
      silhouettes: parsed.silhouettes?.length ? parsed.silhouettes : fallback.silhouettes,
      fabrics: parsed.fabrics?.length ? parsed.fabrics : fallback.fabrics,
      alwaysRules: parsed.alwaysRules?.length ? parsed.alwaysRules : fallback.alwaysRules,
      neverRules: parsed.neverRules?.length ? parsed.neverRules : fallback.neverRules,
      signaturePieces: parsed.signaturePieces?.length
        ? parsed.signaturePieces
        : fallback.signaturePieces,
      vibeReferences: parsed.vibeReferences?.length
        ? parsed.vibeReferences
        : fallback.vibeReferences,
    };
  } catch {
    return fallback;
  }
}

export async function generateBlueprint(
  system: StyleSystemData,
  events: LifeEvent[],
  profile: StyleProfileInput,
): Promise<BlueprintPiece[]> {
  const fallback = buildFallbackBlueprint(system, events);
  const client = await openaiClient();
  if (!client) return fallback;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Return JSON { "pieces": BlueprintPiece[] } where each piece has id, eventId, eventName, category, name, rationale, quantity, priority, ownership:"not_owned". Architect a cohesive wardrobe by event — not random shopping.',
        },
        {
          role: "user",
          content: JSON.stringify({ system, events, profile }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { pieces?: BlueprintPiece[] };
    if (!parsed.pieces?.length) return fallback;
    return parsed.pieces.map((p, i) => ({
      ...p,
      ownership: p.ownership || "not_owned",
      priority: p.priority || i + 1,
      quantity: p.quantity || 1,
    }));
  } catch {
    return fallback;
  }
}

export async function generateRoadmap(pieces: BlueprintPiece[]): Promise<{
  items: RoadmapItem[];
  weeklyFocus: string;
}> {
  const fallback = buildFallbackRoadmap(pieces);
  const client = await openaiClient();
  if (!client) return fallback;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Return JSON { "weeklyFocus": string, "items": RoadmapItem[] } with id, pieceId, title, reason, budgetTier (essential|upgrade|aspirational), order, unlocks, done:false. Order by rebuild leverage.',
        },
        {
          role: "user",
          content: JSON.stringify({ pieces }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as {
      weeklyFocus?: string;
      items?: RoadmapItem[];
    };
    if (!parsed.items?.length) return fallback;
    return {
      weeklyFocus: parsed.weeklyFocus || fallback.weeklyFocus,
      items: parsed.items.map((item, i) => ({
        ...item,
        order: item.order || i + 1,
        done: false,
      })),
    };
  } catch {
    return fallback;
  }
}

export async function evaluatePurchaseFit(
  description: string,
  system: StyleSystemData,
): Promise<PurchaseFitResult> {
  const fallback = buildFallbackPurchaseFit(description, system);
  const client = await openaiClient();
  if (!client) return fallback;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Score whether a purchase fits a personal style system. Return JSON { score:0-100, verdict:"fits"|"stretch"|"skip", reasons:string[], suggestions:string[] }. Prefer cohesion over novelty.',
        },
        {
          role: "user",
          content: JSON.stringify({ description, system }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as PurchaseFitResult;
  } catch {
    return fallback;
  }
}
