import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { appOrigin } from "@/lib/env";

export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe = getStripe();
  if (!stripe || !user.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer on this account. Upgrade first, or use account settings in dev." },
      { status: 400 },
    );
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appOrigin()}/account`,
  });

  return NextResponse.json({ url: portal.url });
}
