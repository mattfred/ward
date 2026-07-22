import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { isProduction } from "@/lib/env";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    if (!secret || !signature) {
      if (isProduction()) {
        return NextResponse.json({ error: "Webhook signature required" }, { status: 400 });
      }
      // Dev-only: allow unsigned payloads for local stripe CLI experimentation
      event = JSON.parse(body);
    } else {
      event = stripe.webhooks.constructEvent(body, signature, secret);
    }
  } catch {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId as string | undefined;
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: "premium",
          stripeSubscriptionId: subscriptionId,
        },
      });
      await track("subscription_activated", {
        userId,
        props: { mode: "stripe" },
      });
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object;
    const customerId = typeof sub.customer === "string" ? sub.customer : null;
    const active = event.type !== "customer.subscription.deleted" && sub.status === "active";
    if (customerId) {
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          plan: active ? "premium" : "free",
          stripeSubscriptionId: active && typeof sub.id === "string" ? sub.id : null,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
