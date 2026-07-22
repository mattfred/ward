import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, parseJson } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { evaluatePurchaseFit } from "@/lib/ai";
import { track } from "@/lib/analytics";
import type { StyleSystemData } from "@/lib/types";
import { isPremium } from "@/lib/freemium";

const schema = z.object({
  description: z.string().min(8).max(2000),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isPremium(user.plan)) {
    return NextResponse.json(
      { error: "Purchase-fit checks are a Premium feature", upgrade: true },
      { status: 402 },
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Describe the item more clearly" }, { status: 400 });
  }

  const systemRow = await prisma.styleSystem.findUnique({ where: { userId: user.id } });
  if (!systemRow) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  }

  const system: StyleSystemData = {
    manifesto: systemRow.manifesto,
    palette: parseJson(systemRow.palette, []),
    silhouettes: parseJson(systemRow.silhouettes, []),
    fabrics: parseJson(systemRow.fabrics, []),
    alwaysRules: parseJson(systemRow.alwaysRules, []),
    neverRules: parseJson(systemRow.neverRules, []),
    signaturePieces: parseJson(systemRow.signaturePieces, []),
    vibeReferences: parseJson(systemRow.vibeReferences, []),
  };

  const result = await evaluatePurchaseFit(parsed.data.description, system);
  await track("purchase_check", { userId: user.id, props: { score: result.score } });

  return NextResponse.json(result);
}
