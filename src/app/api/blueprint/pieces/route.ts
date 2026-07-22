import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, parseJson } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { memoryFromRow } from "@/lib/profile";
import { rememberEdit, rememberRejection } from "@/lib/memory";
import type { BlueprintPiece, RoadmapItem } from "@/lib/types";

const updateSchema = z.object({
  action: z.literal("update"),
  pieceId: z.string().min(1),
  reason: z.string().max(500).optional(),
  patch: z.object({
    name: z.string().min(1).max(120).optional(),
    category: z.string().min(1).max(60).optional(),
    rationale: z.string().min(1).max(800).optional(),
    quantity: z.number().int().min(1).max(12).optional(),
    visualBrief: z.string().max(800).optional(),
    searchQuery: z.string().max(200).optional(),
  }),
});

const removeSchema = z.object({
  action: z.enum(["remove", "reject"]),
  pieceId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

const schema = z.union([updateSchema, removeSchema]);

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid piece update" }, { status: 400 });
  }

  const blueprint = await prisma.wardrobeBlueprint.findUnique({
    where: { userId: user.id },
  });
  if (!blueprint) {
    return NextResponse.json({ error: "No blueprint" }, { status: 404 });
  }

  const pieces = parseJson<BlueprintPiece[]>(blueprint.pieces, []);
  const idx = pieces.findIndex((p) => p.id === parsed.data.pieceId);
  if (idx < 0) {
    return NextResponse.json({ error: "Piece not found" }, { status: 404 });
  }

  const before = pieces[idx];
  let nextPieces = [...pieces];
  let memoryChanged = false;

  const profileRow = await prisma.styleProfile.findUnique({ where: { userId: user.id } });
  let memory = memoryFromRow(profileRow || {});

  if (parsed.data.action === "update") {
    const after: BlueprintPiece = {
      ...before,
      ...parsed.data.patch,
      name: parsed.data.patch.name?.trim() || before.name,
      category: parsed.data.patch.category?.trim() || before.category,
      rationale: parsed.data.patch.rationale?.trim() || before.rationale,
      quantity: parsed.data.patch.quantity ?? before.quantity,
      visualBrief:
        parsed.data.patch.visualBrief !== undefined
          ? parsed.data.patch.visualBrief.trim()
          : before.visualBrief,
      searchQuery:
        parsed.data.patch.searchQuery !== undefined
          ? parsed.data.patch.searchQuery.trim()
          : before.searchQuery,
    };
    nextPieces[idx] = after;
    memory = rememberEdit(memory, before, after, parsed.data.reason);
    memoryChanged = true;

    const roadmap = await prisma.rebuildRoadmap.findUnique({ where: { userId: user.id } });
    if (roadmap) {
      const items = parseJson<RoadmapItem[]>(roadmap.items, []).map((item) =>
        item.pieceId === after.id
          ? { ...item, title: after.name, reason: after.rationale }
          : item,
      );
      await prisma.rebuildRoadmap.update({
        where: { userId: user.id },
        data: { items: JSON.stringify(items) },
      });
    }
  } else {
    const teachAi = parsed.data.action === "reject" || Boolean(parsed.data.reason?.trim());
    if (teachAi) {
      memory = rememberRejection(memory, before, parsed.data.reason || "");
      memoryChanged = true;
    }
    nextPieces = nextPieces.filter((p) => p.id !== before.id);

    const roadmap = await prisma.rebuildRoadmap.findUnique({ where: { userId: user.id } });
    if (roadmap) {
      const items = parseJson<RoadmapItem[]>(roadmap.items, []).filter(
        (item) => item.pieceId !== before.id,
      );
      await prisma.rebuildRoadmap.update({
        where: { userId: user.id },
        data: { items: JSON.stringify(items) },
      });
    }
  }

  await prisma.wardrobeBlueprint.update({
    where: { userId: user.id },
    data: { pieces: JSON.stringify(nextPieces) },
  });

  if (memoryChanged && profileRow) {
    await prisma.styleProfile.update({
      where: { userId: user.id },
      data: { preferenceMemory: JSON.stringify(memory) },
    });
  }

  return NextResponse.json({
    ok: true,
    pieces: nextPieces,
    memory,
  });
}
