import { NextResponse } from "next/server";
import { requireUser, parseJson } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateOutfitImage } from "@/lib/ai";
import { isAllowedImageData } from "@/lib/closet";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  outfitId: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.plan !== "premium") {
    return NextResponse.json(
      { error: "AI outfit images are a Premium feature." },
      { status: 403 },
    );
  }

  const rl = rateLimit(clientKey(req, `outfit-img:${user.id}`), { limit: 8, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many image requests" }, { status: 429 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const outfit = await prisma.outfit.findFirst({
    where: { id: parsed.data.outfitId, userId: user.id },
  });
  if (!outfit) return NextResponse.json({ error: "Outfit not found" }, { status: 404 });

  const itemIds = parseJson<string[]>(outfit.itemIds, []);
  const items = await prisma.closetItem.findMany({
    where: { userId: user.id, id: { in: itemIds } },
  });
  const system = await prisma.styleSystem.findUnique({ where: { userId: user.id } });
  const palette = system ? parseJson<{ name: string }[]>(system.palette, []).map((p) => p.name) : [];
  const silhouettes = system ? parseJson<string[]>(system.silhouettes, []) : [];

  const imageData = await generateOutfitImage({
    outfitName: outfit.name,
    pieces: items.map((i) => `${i.color || ""} ${i.name} (${i.category})`.trim()),
    palette,
    silhouettes,
  });

  if (!imageData || !isAllowedImageData(imageData)) {
    return NextResponse.json(
      { error: "Could not generate image. Try again later." },
      { status: 502 },
    );
  }

  const updated = await prisma.outfit.update({
    where: { id: outfit.id },
    data: { imageData },
  });

  return NextResponse.json({
    outfit: {
      id: updated.id,
      imageData: updated.imageData,
    },
  });
}
