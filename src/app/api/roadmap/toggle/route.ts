import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, parseJson } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { RoadmapItem } from "@/lib/types";

const schema = z.object({
  itemId: z.string(),
  done: z.boolean(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const roadmap = await prisma.rebuildRoadmap.findUnique({
    where: { userId: user.id },
  });
  if (!roadmap) {
    return NextResponse.json({ error: "No roadmap" }, { status: 404 });
  }

  const items = parseJson<RoadmapItem[]>(roadmap.items, []);
  const next = items.map((i) =>
    i.id === parsed.data.itemId ? { ...i, done: parsed.data.done } : i,
  );

  await prisma.rebuildRoadmap.update({
    where: { userId: user.id },
    data: { items: JSON.stringify(next) },
  });

  return NextResponse.json({ ok: true });
}
