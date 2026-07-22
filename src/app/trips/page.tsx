import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/session";
import { TripManager } from "@/components/TripManager";

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [trips, items] = await Promise.all([
    prisma.tripWardrobe.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.closetItem.findMany({
      where: { userId: session.user.id, archived: false },
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
            Trips & events
          </h1>
          <p style={{ color: "var(--ink-soft)" }}>
            Build temporary wardrobes and packing checklists without polluting your daily system.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/closet" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
            Closet
          </Link>
          <Link href="/outfits" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
            Outfits
          </Link>
          <Link href="/dashboard" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
            Dashboard
          </Link>
        </div>
      </div>
      <div style={{ marginTop: "1.25rem" }}>
        <TripManager
          closetItems={items.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            color: item.color ?? undefined,
            wearCount: item.wearCount,
            condition: item.condition as "good" | "fair" | "poor" | "repair",
            season: item.season as "all" | "spring" | "summer" | "fall" | "winter",
            archived: item.archived,
            blueprintPieceId: item.blueprintPieceId,
            acquiredAt: item.acquiredAt?.toISOString() ?? null,
            purchasePrice: item.purchasePrice,
          }))}
          initialTrips={trips.map((t) => ({
            id: t.id,
            name: t.name,
            destination: t.destination,
            startDate: t.startDate?.toISOString() ?? null,
            endDate: t.endDate?.toISOString() ?? null,
            itemIds: parseJson(t.itemIds, []),
            outfitIds: parseJson(t.outfitIds, []),
            notes: t.notes,
            packingChecklist: parseJson(t.packingChecklist, []),
          }))}
        />
      </div>
    </main>
  );
}
