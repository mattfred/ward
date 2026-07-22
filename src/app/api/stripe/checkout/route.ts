import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { allowDevBillingBypass, appOrigin, isProduction } from "@/lib/env";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(clientKey(req, `checkout:${user.id}`), { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many checkout attempts" }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  const interval = parsed.success ? parsed.data.interval : "monthly";

  const stripe = getStripe();
  const priceId =
    interval === "yearly"
      ? process.env.STRIPE_PRICE_YEARLY?.trim()
      : process.env.STRIPE_PRICE_MONTHLY?.trim();

  if (!stripe || !priceId) {
    if (!allowDevBillingBypass()) {
      return NextResponse.json(
        {
          error: isProduction()
            ? "Billing is not configured. Please try again later."
            : "Stripe is not configured. Set STRIPE_* env vars or ALLOW_DEV_PREMIUM_BYPASS=true for local testing.",
        },
        { status: 503 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "premium" },
    });
    await track("subscription_activated", {
      userId: user.id,
      props: { mode: "dev_bypass", interval },
    });
    return NextResponse.json({
      ok: true,
      mode: "dev_bypass",
      message: "Premium activated (dev bypass).",
    });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const origin = appOrigin();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
    metadata: { userId: user.id },
  });

  await track("checkout_started", { userId: user.id, props: { interval } });

  return NextResponse.json({ url: session.url });
}
