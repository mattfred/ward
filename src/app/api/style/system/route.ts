import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const paletteSwatch = z.object({
  name: z.string().min(1).max(40),
  hex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
});

const schema = z.object({
  manifesto: z.string().min(20).max(4000).optional(),
  alwaysRules: z.array(z.string().min(1)).min(1).max(12).optional(),
  neverRules: z.array(z.string().min(1)).min(1).max(12).optional(),
  silhouettes: z.array(z.string().min(1)).min(1).max(8).optional(),
  vibeReferences: z.array(z.string().min(1)).max(12).optional(),
  palette: z.array(paletteSwatch).min(1).max(12).optional(),
  fabrics: z.array(z.string().min(1)).min(1).max(12).optional(),
  signaturePieces: z.array(z.string().min(1)).min(1).max(12).optional(),
});

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid style system update" }, { status: 400 });
  }

  const existing = await prisma.styleSystem.findUnique({ where: { userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "No style system" }, { status: 404 });
  }

  const data: Record<string, string> = {};
  if (parsed.data.manifesto) data.manifesto = parsed.data.manifesto;
  if (parsed.data.alwaysRules) data.alwaysRules = JSON.stringify(parsed.data.alwaysRules);
  if (parsed.data.neverRules) data.neverRules = JSON.stringify(parsed.data.neverRules);
  if (parsed.data.silhouettes) data.silhouettes = JSON.stringify(parsed.data.silhouettes);
  if (parsed.data.vibeReferences) data.vibeReferences = JSON.stringify(parsed.data.vibeReferences);
  if (parsed.data.palette) data.palette = JSON.stringify(parsed.data.palette);
  if (parsed.data.fabrics) data.fabrics = JSON.stringify(parsed.data.fabrics);
  if (parsed.data.signaturePieces) {
    data.signaturePieces = JSON.stringify(parsed.data.signaturePieces);
  }

  await prisma.styleSystem.update({
    where: { userId: user.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
