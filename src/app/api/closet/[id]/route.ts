import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  CLOSET_CONDITIONS,
  CLOSET_SEASONS,
  isAllowedImageData,
} from "@/lib/closet";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  category: z.string().min(1).max(60).optional(),
  color: z.string().max(60).optional().nullable(),
  brand: z.string().max(80).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  imageData: z.string().optional().nullable(),
  acquiredAt: z.string().datetime().optional().nullable(),
  purchasePrice: z.number().min(0).max(100000).optional().nullable(),
  condition: z.enum(CLOSET_CONDITIONS).optional(),
  season: z.enum(CLOSET_SEASONS).optional(),
  blueprintPieceId: z.string().max(120).optional().nullable(),
  archived: z.boolean().optional(),
  action: z.enum(["wear"]).optional(),
});

function serialize(item: {
  id: string;
  name: string;
  category: string;
  color: string | null;
  brand: string | null;
  notes: string | null;
  imageData: string | null;
  acquiredAt: Date | null;
  purchasePrice: number | null;
  wearCount: number;
  lastWornAt: Date | null;
  condition: string;
  season: string;
  archived: boolean;
  blueprintPieceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    color: item.color,
    brand: item.brand,
    notes: item.notes,
    imageData: item.imageData,
    acquiredAt: item.acquiredAt?.toISOString() ?? null,
    purchasePrice: item.purchasePrice,
    wearCount: item.wearCount,
    lastWornAt: item.lastWornAt?.toISOString() ?? null,
    condition: item.condition,
    season: item.season,
    archived: item.archived,
    blueprintPieceId: item.blueprintPieceId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const existing = await prisma.closetItem.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  if (parsed.data.action === "wear") {
    const item = await prisma.closetItem.update({
      where: { id },
      data: {
        wearCount: existing.wearCount + 1,
        lastWornAt: new Date(),
      },
    });
    return NextResponse.json({ item: serialize(item) });
  }

  if (parsed.data.imageData !== undefined && !isAllowedImageData(parsed.data.imageData)) {
    return NextResponse.json(
      { error: "Image too large or invalid. Use a smaller photo or a URL." },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
  if (parsed.data.category !== undefined) data.category = parsed.data.category.trim();
  if (parsed.data.color !== undefined) data.color = parsed.data.color?.trim() || null;
  if (parsed.data.brand !== undefined) data.brand = parsed.data.brand?.trim() || null;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes?.trim() || null;
  if (parsed.data.imageData !== undefined) data.imageData = parsed.data.imageData || null;
  if (parsed.data.acquiredAt !== undefined) {
    data.acquiredAt = parsed.data.acquiredAt ? new Date(parsed.data.acquiredAt) : null;
  }
  if (parsed.data.purchasePrice !== undefined) data.purchasePrice = parsed.data.purchasePrice;
  if (parsed.data.condition !== undefined) data.condition = parsed.data.condition;
  if (parsed.data.season !== undefined) data.season = parsed.data.season;
  if (parsed.data.blueprintPieceId !== undefined) {
    data.blueprintPieceId = parsed.data.blueprintPieceId || null;
  }
  if (parsed.data.archived !== undefined) data.archived = parsed.data.archived;

  const item = await prisma.closetItem.update({ where: { id }, data });
  return NextResponse.json({ item: serialize(item) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const existing = await prisma.closetItem.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.closetItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
