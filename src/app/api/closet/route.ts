import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  CLOSET_CATEGORIES,
  CLOSET_CONDITIONS,
  CLOSET_SEASONS,
  closetLimitReached,
  isAllowedImageData,
} from "@/lib/closet";

const itemSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
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

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("archived") === "1";

  const items = await prisma.closetItem.findMany({
    where: {
      userId: user.id,
      ...(includeArchived ? {} : { archived: false }),
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return NextResponse.json({
    items: items.map(serialize),
    categories: CLOSET_CATEGORIES,
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = itemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid closet item" }, { status: 400 });
  }

  if (!isAllowedImageData(parsed.data.imageData)) {
    return NextResponse.json(
      { error: "Image too large or invalid. Use a smaller photo or a URL." },
      { status: 400 },
    );
  }

  const count = await prisma.closetItem.count({
    where: { userId: user.id, archived: false },
  });
  if (closetLimitReached(count, user.plan)) {
    return NextResponse.json(
      { error: "Free plan closet limit reached. Upgrade for unlimited items." },
      { status: 403 },
    );
  }

  const item = await prisma.closetItem.create({
    data: {
      userId: user.id,
      name: parsed.data.name.trim(),
      category: parsed.data.category.trim(),
      color: parsed.data.color?.trim() || null,
      brand: parsed.data.brand?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      imageData: parsed.data.imageData || null,
      acquiredAt: parsed.data.acquiredAt ? new Date(parsed.data.acquiredAt) : null,
      purchasePrice: parsed.data.purchasePrice ?? null,
      condition: parsed.data.condition || "good",
      season: parsed.data.season || "all",
      blueprintPieceId: parsed.data.blueprintPieceId || null,
      archived: parsed.data.archived ?? false,
    },
  });

  return NextResponse.json({ item: serialize(item) });
}
