import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/session";
import { isPremium } from "@/lib/freemium";
import { OutfitManager } from "@/components/OutfitManager";

export default async function OutfitsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const [outfits, items] = await Promise.all([
    prisma.outfit.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.closetItem.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="shell" style={{ padding: "1.5rem 0 4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <Link href="/dashboard" className="display" style={{ fontSize: "1.8rem" }}>
            Ward
          </Link>
          <h1 className="display" style={{ fontSize: "2.2rem", margin: "0.4rem 0 0" }}>
            Outfits
          </h1>
          <p style={{ color: "var(--ink-soft)" }}>
            Build looks from what you own, log wears, and generate AI ideas.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/closet" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
            Closet
          </Link>
          <Link href="/trips" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
            Trips
          </Link>
          <Link href="/dashboard" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
            Dashboard
          </Link>
        </div>
      </div>
      <div style={{ marginTop: "1.25rem" }}>
        <OutfitManager
          premium={isPremium(user.plan)}
          closetItems={items.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            color: item.color ?? undefined,
            brand: item.brand ?? undefined,
            notes: item.notes ?? undefined,
            imageData: item.imageData,
            acquiredAt: item.acquiredAt?.toISOString() ?? null,
            purchasePrice: item.purchasePrice,
            wearCount: item.wearCount,
            lastWornAt: item.lastWornAt?.toISOString() ?? null,
            condition: item.condition as "good" | "fair" | "poor" | "repair",
            season: item.season as "all" | "spring" | "summer" | "fall" | "winter",
            archived: item.archived,
            blueprintPieceId: item.blueprintPieceId,
          }))}
          initialOutfits={outfits.map((o) => ({
            id: o.id,
            name: o.name,
            notes: o.notes,
            itemIds: parseJson(o.itemIds, []),
            tags: parseJson(o.tags, []),
            occasion: o.occasion,
            imageData: o.imageData,
            wearCount: o.wearCount,
            lastWornAt: o.lastWornAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </main>
  );
}
