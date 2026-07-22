import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import {
  generateBlueprint,
  generateRoadmap,
  generateStyleSystem,
} from "@/lib/ai";
import type { LifeEvent, StyleProfileInput } from "@/lib/types";

const schema = z.object({
  profile: z.object({
    aestheticRefs: z.array(z.string()).min(1),
    preferredColors: z.array(z.string()).min(1),
    avoidColors: z.array(z.string()),
    fitPreferences: z.object({
      tops: z.string(),
      bottoms: z.string(),
      overall: z.string(),
    }),
    climate: z.string(),
    budgetTier: z.enum(["low", "mid", "high"]),
    trustedBrands: z.array(z.string()),
    values: z.array(z.string()),
    notes: z.string().optional(),
  }),
  events: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        frequency: z.string(),
        dressCode: z.string(),
        priority: z.number(),
      }),
    )
    .min(1),
  primaryEventId: z.string(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding payload" }, { status: 400 });
  }

  const profile = parsed.data.profile as StyleProfileInput;
  const events = parsed.data.events as LifeEvent[];

  await track("onboarding_started", { userId: user.id });

  const system = await generateStyleSystem(profile, events);
  const pieces = await generateBlueprint(system, events, profile);
  const roadmap = await generateRoadmap(pieces);

  await prisma.styleProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      aestheticRefs: JSON.stringify(profile.aestheticRefs),
      preferredColors: JSON.stringify(profile.preferredColors),
      avoidColors: JSON.stringify(profile.avoidColors),
      fitPreferences: JSON.stringify(profile.fitPreferences),
      climate: profile.climate,
      budgetTier: profile.budgetTier,
      trustedBrands: JSON.stringify(profile.trustedBrands),
      values: JSON.stringify(profile.values),
      notes: profile.notes ?? null,
    },
    update: {
      aestheticRefs: JSON.stringify(profile.aestheticRefs),
      preferredColors: JSON.stringify(profile.preferredColors),
      avoidColors: JSON.stringify(profile.avoidColors),
      fitPreferences: JSON.stringify(profile.fitPreferences),
      climate: profile.climate,
      budgetTier: profile.budgetTier,
      trustedBrands: JSON.stringify(profile.trustedBrands),
      values: JSON.stringify(profile.values),
      notes: profile.notes ?? null,
    },
  });

  await prisma.lifeMap.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      events: JSON.stringify(events),
      primaryEventId: parsed.data.primaryEventId,
    },
    update: {
      events: JSON.stringify(events),
      primaryEventId: parsed.data.primaryEventId,
    },
  });

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

  await prisma.rebuildRoadmap.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      items: JSON.stringify(roadmap.items),
      weeklyFocus: roadmap.weeklyFocus,
    },
    update: {
      items: JSON.stringify(roadmap.items),
      weeklyFocus: roadmap.weeklyFocus,
    },
  });

  await track("onboarding_completed", { userId: user.id });
  await track("style_system_generated", { userId: user.id });

  return NextResponse.json({ ok: true });
}
