import { NextResponse } from "next/server";
import { requireUser, parseJson } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateOutfitsFromCloset } from "@/lib/ai";
import { memoryFromRow } from "@/lib/profile";
import type { StyleSystemData } from "@/lib/types";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(clientKey(req, `outfit-ai:${user.id}`), { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const items = await prisma.closetItem.findMany({
    where: { userId: user.id, archived: false },
    select: { id: true, name: true, category: true, color: true },
  });
  if (items.length < 2) {
    return NextResponse.json(
      { error: "Add at least two closet items before generating outfits." },
      { status: 400 },
    );
  }

  const systemRow = await prisma.styleSystem.findUnique({ where: { userId: user.id } });
  const profileRow = await prisma.styleProfile.findUnique({ where: { userId: user.id } });
  const system: StyleSystemData | null = systemRow
    ? {
        manifesto: systemRow.manifesto,
        palette: parseJson(systemRow.palette, []),
        silhouettes: parseJson(systemRow.silhouettes, []),
        fabrics: parseJson(systemRow.fabrics, []),
        alwaysRules: parseJson(systemRow.alwaysRules, []),
        neverRules: parseJson(systemRow.neverRules, []),
        signaturePieces: parseJson(systemRow.signaturePieces, []),
        vibeReferences: parseJson(systemRow.vibeReferences, []),
      }
    : null;

  const suggestions = await generateOutfitsFromCloset(
    items,
    system,
    memoryFromRow(profileRow || {}),
  );
  return NextResponse.json({ suggestions });
}
