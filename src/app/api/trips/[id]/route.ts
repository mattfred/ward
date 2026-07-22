import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, parseJson } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildTripChecklist } from "@/lib/outfits";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  destination: z.string().max(120).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  itemIds: z.array(z.string()).max(60).optional(),
  outfitIds: z.array(z.string()).max(30).optional(),
  notes: z.string().max(2000).optional().nullable(),
  packingChecklist: z
    .array(
      z.object({
        itemId: z.string(),
        label: z.string(),
        packed: z.boolean(),
      }),
    )
    .optional(),
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

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await prisma.tripWardrobe.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
  if (parsed.data.destination !== undefined) {
    data.destination = parsed.data.destination?.trim() || null;
  }
  if (parsed.data.startDate !== undefined) {
    data.startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : null;
  }
  if (parsed.data.endDate !== undefined) {
    data.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
  }
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes?.trim() || null;
  if (parsed.data.outfitIds !== undefined) {
    data.outfitIds = JSON.stringify(parsed.data.outfitIds);
  }
  if (parsed.data.itemIds !== undefined) {
    data.itemIds = JSON.stringify(parsed.data.itemIds);
    const items = await prisma.closetItem.findMany({
      where: { userId: user.id, id: { in: parsed.data.itemIds } },
      select: { id: true, name: true, category: true },
    });
    const map = new Map(items.map((i) => [i.id, i]));
    const prev = parseJson<{ itemId: string; packed: boolean }[]>(existing.packingChecklist, []);
    const packedMap = new Map(prev.map((p) => [p.itemId, p.packed]));
    const checklist = buildTripChecklist(parsed.data.itemIds, map).map((row) => ({
      ...row,
      packed: packedMap.get(row.itemId) || false,
    }));
    data.packingChecklist = JSON.stringify(checklist);
  }
  if (parsed.data.packingChecklist !== undefined) {
    data.packingChecklist = JSON.stringify(parsed.data.packingChecklist);
  }

  const row = await prisma.tripWardrobe.update({ where: { id }, data });
  return NextResponse.json({ trip: serialize(row) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await prisma.tripWardrobe.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.tripWardrobe.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
