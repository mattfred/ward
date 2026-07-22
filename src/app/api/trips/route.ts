import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, parseJson } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildTripChecklist, tripLimitReached } from "@/lib/outfits";

const schema = z.object({
  name: z.string().min(1).max(120),
  destination: z.string().max(120).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  itemIds: z.array(z.string()).max(60).optional(),
  outfitIds: z.array(z.string()).max(30).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

function serialize(row: {
  id: string;
  name: string;
  destination: string | null;
  startDate: Date | null;
  endDate: Date | null;
  itemIds: string;
  outfitIds: string;
  notes: string | null;
  packingChecklist: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    destination: row.destination,
    startDate: row.startDate?.toISOString() ?? null,
    endDate: row.endDate?.toISOString() ?? null,
    itemIds: parseJson<string[]>(row.itemIds, []),
    outfitIds: parseJson<string[]>(row.outfitIds, []),
    notes: row.notes,
    packingChecklist: parseJson(row.packingChecklist, []),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.tripWardrobe.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ trips: rows.map(serialize) });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid trip" }, { status: 400 });
  }

  const count = await prisma.tripWardrobe.count({ where: { userId: user.id } });
  if (tripLimitReached(count, user.plan)) {
    return NextResponse.json(
      { error: "Free plan trip limit reached. Upgrade for more." },
      { status: 403 },
    );
  }

  const itemIds = parsed.data.itemIds ?? [];
  const items = await prisma.closetItem.findMany({
    where: { userId: user.id, id: { in: itemIds } },
    select: { id: true, name: true, category: true },
  });
  const map = new Map(items.map((i) => [i.id, i]));
  const checklist = buildTripChecklist(itemIds, map);

  const row = await prisma.tripWardrobe.create({
    data: {
      userId: user.id,
      name: parsed.data.name.trim(),
      destination: parsed.data.destination?.trim() || null,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      itemIds: JSON.stringify(itemIds),
      outfitIds: JSON.stringify(parsed.data.outfitIds ?? []),
      notes: parsed.data.notes?.trim() || null,
      packingChecklist: JSON.stringify(checklist),
    },
  });
  return NextResponse.json({ trip: serialize(row) });
}
