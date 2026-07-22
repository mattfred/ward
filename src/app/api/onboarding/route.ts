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
import { profileReadyForGenerate } from "@/lib/intake";
import { memoryFromRow } from "@/lib/profile";

const profileSchema = z.object({
  aestheticRefs: z.array(z.string()),
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
  genderPresentation: z.string().optional(),
  ageRange: z.string().optional(),
  bodyNotes: z.string().optional(),
  heightBand: z.string().optional(),
  constraints: z.array(z.string()).optional(),
  inspirationRefs: z.array(z.string()).optional(),
  antiRefs: z.array(z.string()).optional(),
  formalityRange: z.string().optional(),
  closetHonesty: z.string().optional(),
  intakeMode: z.enum(["guided", "studio"]).optional(),
});

const schema = z.object({
  profile: profileSchema,
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

function toProfileRow(profile: StyleProfileInput) {
  return {
    aestheticRefs: JSON.stringify(profile.aestheticRefs),
    preferredColors: JSON.stringify(profile.preferredColors),
    avoidColors: JSON.stringify(profile.avoidColors),
    fitPreferences: JSON.stringify(profile.fitPreferences),
    climate: profile.climate || null,
    budgetTier: profile.budgetTier,
    trustedBrands: JSON.stringify(profile.trustedBrands),
    values: JSON.stringify(profile.values),
    notes: profile.notes ?? null,
    genderPresentation: profile.genderPresentation?.trim() || null,
    ageRange: profile.ageRange?.trim() || null,
    bodyNotes: profile.bodyNotes?.trim() || null,
    heightBand: profile.heightBand?.trim() || null,
    constraints: JSON.stringify(profile.constraints ?? []),
    inspirationRefs: JSON.stringify(profile.inspirationRefs ?? []),
    antiRefs: JSON.stringify(profile.antiRefs ?? []),
    formalityRange: profile.formalityRange?.trim() || null,
    closetHonesty: profile.closetHonesty?.trim() || null,
    intakeMode: profile.intakeMode || "guided",
  };
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding payload" }, { status: 400 });
  }

  const profile = parsed.data.profile as StyleProfileInput;
  const events = parsed.data.events as LifeEvent[];

  if (!profileReadyForGenerate(profile)) {
    return NextResponse.json(
      {
        error:
          "Add at least one style direction or inspiration, a color preference, and a fit/body note.",
      },
      { status: 400 },
    );
  }

  // If aesthetics empty, seed from inspiration for downstream prompts
  if (!profile.aestheticRefs.length && profile.inspirationRefs?.length) {
    profile.aestheticRefs = profile.inspirationRefs.slice(0, 4);
  }
  if (!profile.fitPreferences.overall.trim() && profile.bodyNotes?.trim()) {
    profile.fitPreferences.overall = profile.bodyNotes.trim().slice(0, 120);
  }

  await track("onboarding_started", { userId: user.id });

  const existingProfile = await prisma.styleProfile.findUnique({ where: { userId: user.id } });
  const memory = memoryFromRow(existingProfile || {});

  const system = await generateStyleSystem(profile, events, memory);
  const pieces = await generateBlueprint(system, events, profile, memory);
  const roadmap = await generateRoadmap(pieces);
  const row = toProfileRow(profile);

  await prisma.styleProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...row },
    update: row,
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
