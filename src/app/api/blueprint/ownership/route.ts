import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, parseJson } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeWeeklyFocus } from "@/lib/gaps";
import type { BlueprintPiece, OwnershipStatus } from "@/lib/types";

const schema = z.object({
  pieceId: z.string(),
  ownership: z.enum(["not_owned", "owned", "owned_but_wrong"]),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const blueprint = await prisma.wardrobeBlueprint.findUnique({
    where: { userId: user.id },
  });
  if (!blueprint) {
    return NextResponse.json({ error: "No blueprint" }, { status: 404 });
  }

  const pieces = parseJson<BlueprintPiece[]>(blueprint.pieces, []);
  const next = pieces.map((p) =>
    p.id === parsed.data.pieceId
      ? { ...p, ownership: parsed.data.ownership as OwnershipStatus }
      : p,
  );

  await prisma.wardrobeBlueprint.update({
    where: { userId: user.id },
    data: { pieces: JSON.stringify(next) },
  });

  const roadmap = await prisma.rebuildRoadmap.findUnique({ where: { userId: user.id } });
  if (roadmap) {
    await prisma.rebuildRoadmap.update({
      where: { userId: user.id },
      data: { weeklyFocus: computeWeeklyFocus(next, roadmap.weeklyFocus) },
    });
  }

  return NextResponse.json({ ok: true, pieces: next });
}
