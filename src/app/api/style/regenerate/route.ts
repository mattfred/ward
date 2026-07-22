import { NextResponse } from "next/server";
import { requireUser, parseJson } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateBlueprint, generateRoadmap, generateStyleSystem } from "@/lib/ai";
import { computeWeeklyFocus } from "@/lib/gaps";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { track } from "@/lib/analytics";
import type { BlueprintPiece, LifeEvent, StyleProfileInput, StyleSystemData } from "@/lib/types";
import { z } from "zod";

const schema = z.object({
  target: z.enum(["system", "blueprint", "roadmap", "all"]).default("all"),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(clientKey(req, `regen:${user.id}`), { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many regenerations" }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  const target = parsed.success ? parsed.data.target : "all";

  const profileRow = await prisma.styleProfile.findUnique({ where: { userId: user.id } });
  const lifeMap = await prisma.lifeMap.findUnique({ where: { userId: user.id } });
  if (!profileRow || !lifeMap) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  }

  const profile: StyleProfileInput = {
    aestheticRefs: parseJson(profileRow.aestheticRefs, []),
    preferredColors: parseJson(profileRow.preferredColors, []),
    avoidColors: parseJson(profileRow.avoidColors, []),
    fitPreferences: parseJson(profileRow.fitPreferences, {
      tops: "",
      bottoms: "",
      overall: "",
    }),
    climate: profileRow.climate || "",
    budgetTier: (profileRow.budgetTier as "low" | "mid" | "high") || "mid",
    trustedBrands: parseJson(profileRow.trustedBrands, []),
    values: parseJson(profileRow.values, []),
    notes: profileRow.notes || undefined,
  };
  const events = parseJson<LifeEvent[]>(lifeMap.events, []);

  let system: StyleSystemData | null = null;
  if (target === "system" || target === "all") {
    system = await generateStyleSystem(profile, events);
    await prisma.styleSystem.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        manifesto: system.manifesto,
        palette: JSON.stringify(system.palette),
        silhouettes: JSON.stringify(system.silhouettes),
        fabrics: JSON.stringify(system.fabrics),
        alwaysRules: JSON.stringify(system.alwaysRules),
        neverRules: JSON.stringify(system.neverRules),
        signaturePieces: JSON.stringify(system.signaturePieces),
        vibeReferences: JSON.stringify(system.vibeReferences),
        rawJson: JSON.stringify(system),
      },
      update: {
        manifesto: system.manifesto,
        palette: JSON.stringify(system.palette),
        silhouettes: JSON.stringify(system.silhouettes),
        fabrics: JSON.stringify(system.fabrics),
        alwaysRules: JSON.stringify(system.alwaysRules),
        neverRules: JSON.stringify(system.neverRules),
        signaturePieces: JSON.stringify(system.signaturePieces),
        vibeReferences: JSON.stringify(system.vibeReferences),
        rawJson: JSON.stringify(system),
      },
    });
    await track("style_system_generated", { userId: user.id, props: { regenerated: true } });
  } else {
    const row = await prisma.styleSystem.findUnique({ where: { userId: user.id } });
    if (!row) return NextResponse.json({ error: "No style system" }, { status: 400 });
    system = {
      manifesto: row.manifesto,
      palette: parseJson(row.palette, []),
      silhouettes: parseJson(row.silhouettes, []),
      fabrics: parseJson(row.fabrics, []),
      alwaysRules: parseJson(row.alwaysRules, []),
      neverRules: parseJson(row.neverRules, []),
      signaturePieces: parseJson(row.signaturePieces, []),
      vibeReferences: parseJson(row.vibeReferences, []),
    };
  }

  let pieces: BlueprintPiece[] = [];
  if (target === "blueprint" || target === "roadmap" || target === "all") {
    if (target === "blueprint" || target === "all") {
      pieces = await generateBlueprint(system, events, profile);
      // Preserve ownership where ids match
      const existing = await prisma.wardrobeBlueprint.findUnique({ where: { userId: user.id } });
      const prev = parseJson<BlueprintPiece[]>(existing?.pieces, []);
      const ownershipById = new Map(prev.map((p) => [p.id, p.ownership]));
      pieces = pieces.map((p) => ({
        ...p,
        ownership: ownershipById.get(p.id) || p.ownership,
      }));
      await prisma.wardrobeBlueprint.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          pieces: JSON.stringify(pieces),
          summary: `Architecture for ${events.length} life contexts`,
        },
        update: {
          pieces: JSON.stringify(pieces),
          summary: `Architecture for ${events.length} life contexts`,
        },
      });
    } else {
      const existing = await prisma.wardrobeBlueprint.findUnique({ where: { userId: user.id } });
      pieces = parseJson(existing?.pieces, []);
    }
  }

  if (target === "roadmap" || target === "all") {
    if (!pieces.length) {
      const existing = await prisma.wardrobeBlueprint.findUnique({ where: { userId: user.id } });
      pieces = parseJson(existing?.pieces, []);
    }
    const roadmap = await generateRoadmap(pieces);
    const weeklyFocus = computeWeeklyFocus(pieces, roadmap.weeklyFocus);
    await prisma.rebuildRoadmap.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        items: JSON.stringify(roadmap.items),
        weeklyFocus,
      },
      update: {
        items: JSON.stringify(roadmap.items),
        weeklyFocus,
      },
    });
  }

  return NextResponse.json({ ok: true, target });
}
