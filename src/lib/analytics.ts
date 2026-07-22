import { prisma } from "./prisma";

export async function track(
  name: string,
  opts?: { userId?: string | null; props?: Record<string, unknown> },
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        name,
        userId: opts?.userId ?? null,
        props: opts?.props ? JSON.stringify(opts.props) : null,
      },
    });
  } catch {
    // never block UX on analytics
  }
}

export async function getFunnelStats() {
  const names = [
    "signup",
    "onboarding_started",
    "onboarding_completed",
    "style_system_generated",
    "blueprint_viewed",
    "roadmap_viewed",
    "purchase_check",
    "checkout_started",
    "subscription_activated",
    "cohesion_feedback",
  ] as const;

  const counts = await Promise.all(
    names.map(async (name) => ({
      name,
      count: await prisma.analyticsEvent.count({ where: { name } }),
    })),
  );

  const feedback = await prisma.feedback.aggregate({
    _avg: { cohesive: true },
    _count: true,
  });

  return {
    funnel: counts,
    cohesionAvg: feedback._avg.cohesive,
    feedbackCount: feedback._count,
  };
}
