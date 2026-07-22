export const CLOSET_CATEGORIES = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Layers",
  "Outerwear",
  "Shoes",
  "Bags",
  "Accessories",
  "Extras",
] as const;

export const CLOSET_CONDITIONS = ["good", "fair", "poor", "repair"] as const;

export const CLOSET_SEASONS = ["all", "spring", "summer", "fall", "winter"] as const;

export type ClosetCategory = (typeof CLOSET_CATEGORIES)[number];
export type ClosetCondition = (typeof CLOSET_CONDITIONS)[number];
export type ClosetSeason = (typeof CLOSET_SEASONS)[number];

export type ClosetItemInput = {
  name: string;
  category: string;
  color?: string;
  brand?: string;
  notes?: string;
  imageData?: string | null;
  acquiredAt?: string | null;
  purchasePrice?: number | null;
  condition?: ClosetCondition;
  season?: ClosetSeason;
  blueprintPieceId?: string | null;
  archived?: boolean;
};

export type ClosetItemRecord = ClosetItemInput & {
  id: string;
  wearCount: number;
  lastWornAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Days since acquired (or null if unknown). */
export function itemAgeDays(acquiredAt: string | Date | null | undefined, now = new Date()): number | null {
  if (!acquiredAt) return null;
  const d = acquiredAt instanceof Date ? acquiredAt : new Date(acquiredAt);
  if (Number.isNaN(d.getTime())) return null;
  const ms = now.getTime() - d.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function formatItemAge(acquiredAt: string | Date | null | undefined, now = new Date()): string {
  const days = itemAgeDays(acquiredAt, now);
  if (days === null) return "Age unknown";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} old`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months} month${months === 1 ? "" : "s"} old`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} old`;
}

/** Cost per wear; null if price missing or never worn (show estimate as full price). */
export function costPerWear(
  purchasePrice: number | null | undefined,
  wearCount: number,
): number | null {
  if (purchasePrice == null || Number.isNaN(purchasePrice) || purchasePrice < 0) return null;
  if (wearCount <= 0) return purchasePrice;
  return Math.round((purchasePrice / wearCount) * 100) / 100;
}

export function formatCostPerWear(price: number | null | undefined, wearCount: number): string {
  const cpw = costPerWear(price, wearCount);
  if (cpw === null) return "—";
  if (wearCount <= 0) return `$${cpw.toFixed(2)} (unworn)`;
  return `$${cpw.toFixed(2)} / wear`;
}

export function applyWear(
  item: { wearCount: number; lastWornAt?: string | null },
  at = new Date(),
): { wearCount: number; lastWornAt: string } {
  return {
    wearCount: Math.max(0, item.wearCount) + 1,
    lastWornAt: at.toISOString(),
  };
}

/** Max data-URL length (~350KB) to keep Postgres rows reasonable. */
export const MAX_IMAGE_DATA_CHARS = 350_000;

export function isAllowedImageData(value: string | null | undefined): boolean {
  if (!value) return true;
  if (value.length > MAX_IMAGE_DATA_CHARS) return false;
  if (value.startsWith("https://") || value.startsWith("http://")) return value.length < 2048;
  if (value.startsWith("data:image/")) return true;
  return false;
}

export const FREE_CLOSET_ITEM_LIMIT = 60;
export const FREE_OUTFIT_LIMIT = 20;
export const FREE_TRIP_LIMIT = 3;

export function closetLimitReached(count: number, plan: string): boolean {
  if (plan === "premium") return false;
  return count >= FREE_CLOSET_ITEM_LIMIT;
}
