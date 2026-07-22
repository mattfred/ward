import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  manifesto: z.string().min(20).max(4000).optional(),
  alwaysRules: z.array(z.string()).min(1).max(12).optional(),
  neverRules: z.array(z.string()).min(1).max(12).optional(),
  silhouettes: z.array(z.string()).min(1).max(8).optional(),
  vibeReferences: z.array(z.string()).max(12).optional(),
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

  await prisma.styleSystem.update({
    where: { userId: user.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
