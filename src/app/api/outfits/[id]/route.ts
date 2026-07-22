import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, parseJson } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAllowedImageData } from "@/lib/closet";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  notes: z.string().max(1000).optional().nullable(),
  itemIds: z.array(z.string()).min(1).max(20).optional(),
  tags: z.array(z.string()).max(12).optional(),
  occasion: z.string().max(80).optional().nullable(),
  imageData: z.string().optional().nullable(),
  action: z.enum(["wear"]).optional(),
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

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await prisma.outfit.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  if (parsed.data.action === "wear") {
    const itemIds = parseJson<string[]>(existing.itemIds, []);
    const now = new Date();
    await prisma.$transaction([
      prisma.outfit.update({
        where: { id },
        data: { wearCount: existing.wearCount + 1, lastWornAt: now },
      }),
      ...itemIds.map((itemId) =>
        prisma.closetItem.updateMany({
          where: { id: itemId, userId: user.id },
          data: { wearCount: { increment: 1 }, lastWornAt: now },
        }),
      ),
    ]);
    const row = await prisma.outfit.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ outfit: serialize(row) });
  }

  if (parsed.data.imageData !== undefined && !isAllowedImageData(parsed.data.imageData)) {
    return NextResponse.json({ error: "Image invalid or too large" }, { status: 400 });
  }

  if (parsed.data.itemIds) {
    const owned = await prisma.closetItem.count({
      where: { userId: user.id, id: { in: parsed.data.itemIds }, archived: false },
    });
    if (owned !== parsed.data.itemIds.length) {
      return NextResponse.json({ error: "Unknown closet items" }, { status: 400 });
    }
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes?.trim() || null;
  if (parsed.data.itemIds !== undefined) data.itemIds = JSON.stringify(parsed.data.itemIds);
  if (parsed.data.tags !== undefined) data.tags = JSON.stringify(parsed.data.tags);
  if (parsed.data.occasion !== undefined) data.occasion = parsed.data.occasion?.trim() || null;
  if (parsed.data.imageData !== undefined) data.imageData = parsed.data.imageData || null;

  const row = await prisma.outfit.update({ where: { id }, data });
  return NextResponse.json({ outfit: serialize(row) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await prisma.outfit.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.outfit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
