import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  buildFallbackBlueprint,
  buildFallbackRoadmap,
  buildFallbackStyleSystem,
} from "../src/lib/ai";
import type { LifeEvent, StyleProfileInput } from "../src/lib/types";
import { computeWeeklyFocus } from "../src/lib/gaps";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL || "demo@ward.local";
  const password = process.env.SEED_PASSWORD || "password123";

  const passwordHash = await hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Demo Stylist",
      passwordHash,
      plan: "free",
    },
    update: {
      name: "Demo Stylist",
      passwordHash,
    },
  });

  const profile: StyleProfileInput = {
    aestheticRefs: ["modern classic", "quiet luxury"],
    preferredColors: ["navy", "charcoal", "cream", "olive"],
    avoidColors: ["rust"],
    fitPreferences: {
      tops: "structured but easy",
      bottoms: "straight / tapered",
      overall: "clean tailored lines",
    },
    climate: "four seasons",
    budgetTier: "mid",
    trustedBrands: ["Uniqlo", "Everlane", "A.P.C."],
    values: ["versatility", "polish", "quality"],
    notes: "Seeded demo profile for soft-launch demos.",
  };

  const events: LifeEvent[] = [
    { id: "work", name: "Work week", frequency: "5x / week", dressCode: "smart casual", priority: 1 },
    { id: "weekend", name: "Weekends", frequency: "2x / week", dressCode: "intentional casual", priority: 2 },
    { id: "social", name: "Dinner / social", frequency: "2x / month", dressCode: "elevated", priority: 3 },
  ];

  const system = buildFallbackStyleSystem(profile, events);
  const pieces = buildFallbackBlueprint(system, events);
  const roadmap = buildFallbackRoadmap(pieces);
  const weeklyFocus = computeWeeklyFocus(pieces, roadmap.weeklyFocus);

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
      notes: profile.notes,
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
      notes: profile.notes,
    },
  });

  await prisma.lifeMap.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      events: JSON.stringify(events),
      primaryEventId: "work",
    },
    update: {
      events: JSON.stringify(events),
      primaryEventId: "work",
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
      summary: "Seeded demo blueprint",
    },
    update: {
      pieces: JSON.stringify(pieces),
      summary: "Seeded demo blueprint",
    },
  });

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

  console.log(`Seeded demo user ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
