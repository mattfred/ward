import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/session";
import type { BlueprintPiece } from "@/lib/types";
import { ClosetManager } from "@/components/ClosetManager";

export default async function ClosetPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [items, blueprint] = await Promise.all([
    prisma.closetItem.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.wardrobeBlueprint.findUnique({ where: { userId: session.user.id } }),
  ]);

  const pieces = parseJson<BlueprintPiece[]>(blueprint?.pieces, []);
  const blueprintOptions = pieces.map((p) => ({
    id: p.id,
    label: `${p.eventName} · ${p.category}: ${p.name}`,
  }));

  const initialItems = items.map((item) => ({
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
  }));

  return (
    <main className="shell" style={{ padding: "1.5rem 0 4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <Link href="/dashboard" className="display" style={{ fontSize: "1.8rem" }}>
            Ward
          </Link>
          <h1 className="display" style={{ fontSize: "2.2rem", margin: "0.4rem 0 0" }}>
            Closet
          </h1>
          <p style={{ color: "var(--ink-soft)", marginTop: "0.35rem" }}>
            Photos, age, wears, and cost-per-wear for everything you own.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/outfits" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
            Outfits
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
        <ClosetManager initialItems={initialItems} blueprintOptions={blueprintOptions} />
      </div>
    </main>
  );
}
