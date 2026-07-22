import type { LifeEvent, StyleProfileInput } from "@/lib/types";

export const GENDER_OPTIONS = [
  "Woman",
  "Man",
  "Nonbinary",
  "Prefer not to say",
] as const;

export const AGE_RANGES = ["18–24", "25–34", "35–44", "45–54", "55+", "Prefer not to say"] as const;

export const HEIGHT_BANDS = [
  "Under 5'4 / 163cm",
  "5'4–5'8 / 163–173cm",
  "5'8–6'0 / 173–183cm",
  "Over 6'0 / 183cm",
  "Prefer not to say",
] as const;

export const AESTHETICS = [
  "modern classic",
  "quiet luxury",
  "utilitarian",
  "creative professional",
  "relaxed tailored",
  "minimal outdoor",
  "soft romantic",
  "street polish",
  "heritage prep",
  "atelier minimal",
];

export const COLORS = [
  "navy",
  "charcoal",
  "cream",
  "olive",
  "camel",
  "burgundy",
  "stone",
  "black",
  "white",
  "denim",
  "forest",
  "blush",
];

export const VALUES = [
  "quality",
  "versatility",
  "comfort",
  "polish",
  "sustainability",
  "ease",
  "expression",
  "modesty",
];

export const CONSTRAINTS = [
  "Lots of walking / commute",
  "Need machine-washable only",
  "Prefer low-maintenance fabrics",
  "Sensory-sensitive (tags, scratchy)",
  "Modest coverage preferences",
  "Allergy / skin sensitivities",
  "Limited storage space",
  "Mostly shop online",
];

export const FORMALITY = [
  "Mostly casual",
  "Smart casual base",
  "Business casual / office",
  "Wide range (casual → formal)",
];

export const CLOSET_HONESTY = [
  "Most pieces still work — I need cohesion",
  "Half fits my life, half doesn't",
  "Starting over / big rebuild",
  "Closet is full but nothing goes together",
];

export const DEFAULT_EVENTS: LifeEvent[] = [
  { id: "work", name: "Work week", frequency: "5x / week", dressCode: "smart casual", priority: 1 },
  { id: "weekend", name: "Weekends", frequency: "2x / week", dressCode: "intentional casual", priority: 2 },
  { id: "social", name: "Dinner / social", frequency: "2x / month", dressCode: "elevated", priority: 3 },
  { id: "travel", name: "Travel", frequency: "monthly", dressCode: "packable polished", priority: 4 },
];

export type CoachResponse = {
  summary: string;
  suggestedChips: string[];
  clarifyingQuestion: string | null;
  fieldHints: Partial<Record<keyof StyleProfileInput | "events", string>>;
};

export function emptyProfile(): StyleProfileInput {
  return {
    aestheticRefs: [],
    preferredColors: [],
    avoidColors: [],
    fitPreferences: {
      tops: "",
      bottoms: "",
      overall: "",
    },
    climate: "",
    budgetTier: "mid",
    trustedBrands: [],
    values: [],
    notes: "",
    genderPresentation: "",
    ageRange: "",
    bodyNotes: "",
    heightBand: "",
    constraints: [],
    inspirationRefs: [],
    antiRefs: [],
    formalityRange: "",
    closetHonesty: "",
    intakeMode: "guided",
  };
}

export function buildFallbackCoach(
  profile: Partial<StyleProfileInput>,
  step: string,
): CoachResponse {
  const presentation = profile.genderPresentation?.trim();
  const formality = profile.formalityRange || "smart casual base";
  const aesthetics = profile.aestheticRefs?.length
    ? profile.aestheticRefs.slice(0, 2).join(" + ")
    : "a clean modern baseline";

  if (step === "identity") {
    return {
      summary: presentation
        ? `We'll tailor silhouettes and shopping language for a ${presentation.toLowerCase()} wardrobe — you can change this anytime.`
        : "Presentation is optional. Leave it blank if you'd rather we infer from lifestyle and fit only.",
      suggestedChips: ["modern classic", "quiet luxury", "relaxed tailored", "creative professional"],
      clarifyingQuestion: "Which of these feels closest to how you want to be seen on a normal Tuesday?",
      fieldHints: {
        aestheticRefs: "Pick 1–3 directions — we'll refine later.",
      },
    };
  }

  if (step === "inspiration") {
    return {
      summary: `You're leaning ${aesthetics}. Inspiration works best when you name people, brands, or scenes — not just adjectives.`,
      suggestedChips: ["Everlane", "COS", "A.P.C.", "Uniqlo U", "The Row vibe", "Scandi street"],
      clarifyingQuestion: "Name one outfit you felt most like yourself in recently — what made it work?",
      fieldHints: {
        inspirationRefs: "Brands, public figures, or film/characters are all fine.",
        antiRefs: "Hard avoids help more than vague dislikes.",
      },
    };
  }

  if (step === "body") {
    return {
      summary: "Fit rules beat trend labels. Comfort constraints become permanent never-rules.",
      suggestedChips: ["longer rise", "soft structure", "room in thighs", "defined waist", "easy shoulders"],
      clarifyingQuestion: "What usually fails first — tops, bottoms, or shoes?",
      fieldHints: {
        bodyNotes: "Shoulders, torso length, hips, and mobility notes are gold.",
      },
    };
  }

  if (step === "life") {
    return {
      summary: `Life context drives the blueprint. Formality: ${formality}.`,
      suggestedChips: ["smart casual", "business casual", "elevated casual", "packable polished"],
      clarifyingQuestion: "Which context eats the most outfits each week?",
      fieldHints: {
        climate: "City + seasons beat vague 'cold' or 'hot'.",
      },
    };
  }

  return {
    summary: "Almost ready — honesty about your current closet changes rebuild priority.",
    suggestedChips: ["versatility", "comfort", "quality", "polish"],
    clarifyingQuestion: "If we fixed one frustration this month, what should it be?",
    fieldHints: {
      closetHonesty: "This shapes keep vs replace more than aesthetics do.",
    },
  };
}

export function profileReadyForGenerate(profile: StyleProfileInput) {
  const hasStyleSignal =
    profile.aestheticRefs.length > 0 || (profile.inspirationRefs?.length ?? 0) > 0;
  return (
    hasStyleSignal &&
    profile.preferredColors.length > 0 &&
    Boolean(profile.fitPreferences.overall.trim() || profile.bodyNotes?.trim())
  );
}
