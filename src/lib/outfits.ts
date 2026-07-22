import {
  FREE_OUTFIT_LIMIT,
  FREE_TRIP_LIMIT,
} from "@/lib/closet";

export function outfitLimitReached(count: number, plan: string): boolean {
  if (plan === "premium") return false;
  return count >= FREE_OUTFIT_LIMIT;
}

export function tripLimitReached(count: number, plan: string): boolean {
  if (plan === "premium") return false;
  return count >= FREE_TRIP_LIMIT;
}

export type OutfitSuggestion = {
  name: string;
  itemIds: string[];
  rationale: string;
  occasion?: string;
};

export function buildFallbackOutfitsFromCloset(
  items: { id: string; name: string; category: string; color?: string | null }[],
): OutfitSuggestion[] {
  const active = items.filter(Boolean);
  const byCat = (cat: string) =>
    active.filter((i) => i.category.toLowerCase() === cat.toLowerCase());

  const tops = byCat("Tops");
  const bottoms = byCat("Bottoms");
  const layers = [...byCat("Layers"), ...byCat("Outerwear")];
  const shoes = byCat("Shoes");
  const dresses = byCat("Dresses");

  const suggestions: OutfitSuggestion[] = [];

  const top = tops[0];
  const bottom = bottoms[0];
  const shoe = shoes[0];
  const layer = layers[0];

  if (top && bottom) {
    const ids = [top.id, bottom.id, ...(shoe ? [shoe.id] : []), ...(layer ? [layer.id] : [])];
    suggestions.push({
      name: "Everyday core",
      itemIds: ids,
      rationale: `Pairs ${top.name} with ${bottom.name} for a cohesive daily look from what you own.`,
      occasion: "everyday",
    });
  }

  if (dresses[0]) {
    suggestions.push({
      name: "One-and-done",
      itemIds: [dresses[0].id, ...(shoe ? [shoe.id] : []), ...(layer ? [layer.id] : [])],
      rationale: `Uses your ${dresses[0].name} as the base — add shoes/layer only.`,
      occasion: "smart casual",
    });
  }

  if (tops[1] && bottoms[0]) {
    suggestions.push({
      name: "Second rotation",
      itemIds: [tops[1].id, bottoms[0].id, ...(shoes[1] ? [shoes[1].id] : [])],
      rationale: "A second outfit formula using alternate top + same core bottom.",
      occasion: "weekend",
    });
  }

  if (!suggestions.length && active.length >= 2) {
    suggestions.push({
      name: "Starter look",
      itemIds: active.slice(0, Math.min(4, active.length)).map((i) => i.id),
      rationale: "Combine these owned pieces and refine from here.",
      occasion: "everyday",
    });
  }

  return suggestions.slice(0, 5);
}

export type PackingItem = { itemId: string; label: string; packed: boolean };

export function buildTripChecklist(
  itemIds: string[],
  itemsById: Map<string, { name: string; category: string }>,
): PackingItem[] {
  return itemIds.map((id) => {
    const item = itemsById.get(id);
    return {
      itemId: id,
      label: item ? `${item.category}: ${item.name}` : id,
      packed: false,
    };
  });
}

export function tripDayCount(start?: string | Date | null, end?: string | Date | null): number | null {
  if (!start || !end) return null;
  const a = start instanceof Date ? start : new Date(start);
  const b = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const days = Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
  return days > 0 ? days : null;
}
