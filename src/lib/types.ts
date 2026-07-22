export type LifeEvent = {
  id: string;
  name: string;
  frequency: string;
  dressCode: string;
  priority: number;
};

export type StyleProfileInput = {
  aestheticRefs: string[];
  preferredColors: string[];
  avoidColors: string[];
  fitPreferences: {
    tops: string;
    bottoms: string;
    overall: string;
  };
  climate: string;
  budgetTier: "low" | "mid" | "high";
  trustedBrands: string[];
  values: string[];
  notes?: string;
};

export type PaletteSwatch = { name: string; hex: string };

export type StyleSystemData = {
  manifesto: string;
  palette: PaletteSwatch[];
  silhouettes: string[];
  fabrics: string[];
  alwaysRules: string[];
  neverRules: string[];
  signaturePieces: string[];
  vibeReferences: string[];
};

export type OwnershipStatus = "not_owned" | "owned" | "owned_but_wrong";

export type BlueprintPiece = {
  id: string;
  eventId: string;
  eventName: string;
  category: string;
  name: string;
  rationale: string;
  quantity: number;
  priority: number;
  ownership: OwnershipStatus;
};

export type RoadmapItem = {
  id: string;
  pieceId: string;
  title: string;
  reason: string;
  budgetTier: "essential" | "upgrade" | "aspirational";
  order: number;
  unlocks: string;
  done: boolean;
};

export type PurchaseFitResult = {
  score: number;
  verdict: "fits" | "stretch" | "skip";
  reasons: string[];
  suggestions: string[];
};

export const FREE_ROADMAP_LIMIT = 5;
export const FREE_EVENT_LIMIT = 1;
