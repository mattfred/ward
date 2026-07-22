import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, parseJson } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { outfitLimitReached } from "@/lib/outfits";

const schema = z.object({
  name: z.string().min(1).max(120),
  notes: z.string().max(1000).optional().nullable(),
  itemIds: z.array(z.string()).min(1).max(20),
  tags: z.array(z.string()).max(12).optional(),
  occasion: z.string().max(80).optional().nullable(),
  imageData: z.string().optional().nullable(),
});

function serialize(row: {
  id: string;
  name: string;
  notes: string | null;
  itemIds: string;
  tags: string;
  occasion: string | null;
  imageData: string | null;
  wearCount: number;
  lastWornAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    itemIds: parseJson<string[]>(row.itemIds, []),
    tags: parseJson<string[]>(row.tags, []),
    occasion: row.occasion,
    imageData: row.imageData,
    wearCount: row.wearCount,
    lastWornAt: row.lastWornAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.outfit.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ outfits: rows.map(serialize) });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid outfit" }, { status: 400 });
  }

  const count = await prisma.outfit.count({ where: { userId: user.id } });
  if (outfitLimitReached(count, user.plan)) {
    return NextResponse.json(
      { error: "Free plan outfit limit reached. Upgrade for more." },
      { status: 403 },
    );
  }

  const owned = await prisma.closetItem.findMany({
    where: { userId: user.id, id: { in: parsed.data.itemIds }, archived: false },
    select: { id: true },
  });
  if (owned.length !== parsed.data.itemIds.length) {
    return NextResponse.json({ error: "Outfit includes unknown closet items" }, { status: 400 });
  }

  const row = await prisma.outfit.create({
    data: {
      userId: user.id,
      name: parsed.data.name.trim(),
      notes: parsed.data.notes?.trim() || null,
      itemIds: JSON.stringify(parsed.data.itemIds),
      tags: JSON.stringify(parsed.data.tags ?? []),
      occasion: parsed.data.occasion?.trim() || null,
      imageData: parsed.data.imageData || null,
    },
  });
  return NextResponse.json({ outfit: serialize(row) });
}
