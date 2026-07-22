import { describe, expect, it } from "vitest";
import { gapShoppingLinks, shoppingLinks } from "../src/lib/shopping";
import type { BlueprintPiece } from "../src/lib/types";

const piece: BlueprintPiece = {
  id: "1",
  eventId: "work",
  eventName: "Work",
  category: "Bottoms",
  name: "Core navy trouser",
  rationale: "Daily",
  quantity: 1,
  priority: 1,
  ownership: "not_owned",
  searchQuery: "navy tailored trousers men",
};

describe("shopping links", () => {
  it("builds image and shop URLs", () => {
    const links = shoppingLinks(piece);
    expect(links.images).toContain("tbm=isch");
    expect(links.shop).toContain("tbm=shop");
    expect(gapShoppingLinks(piece).shop).toContain("buy");
  });
});
