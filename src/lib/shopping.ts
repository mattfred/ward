import type { BlueprintPiece } from "@/lib/types";

export function pieceSearchQuery(piece: BlueprintPiece): string {
  if (piece.searchQuery?.trim()) return piece.searchQuery.trim();
  return [piece.name, piece.category, "clothing", "outfit"].filter(Boolean).join(" ");
}

export function pieceVisualBrief(piece: BlueprintPiece): string {
  if (piece.visualBrief?.trim()) return piece.visualBrief.trim();
  return `Look for a ${piece.category.toLowerCase()} that matches “${piece.name}” — ${piece.rationale}`;
}

export function shoppingLinks(piece: BlueprintPiece) {
  const q = encodeURIComponent(pieceSearchQuery(piece));
  return {
    images: `https://www.google.com/search?tbm=isch&q=${q}`,
    shop: `https://www.google.com/search?tbm=shop&q=${q}`,
  };
}

/** Shopping search tuned for a wardrobe gap (adds "buy" intent + category). */
export function gapShoppingLinks(piece: BlueprintPiece) {
  const base = pieceSearchQuery(piece);
  const q = encodeURIComponent(`${base} buy ${piece.category}`);
  return {
    images: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(base)}`,
    shop: `https://www.google.com/search?tbm=shop&q=${q}`,
  };
}
