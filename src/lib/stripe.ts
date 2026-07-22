import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export const PRICING = {
  monthly: { label: "$9.99/mo", amountDisplay: "$9.99" },
  yearly: { label: "$79/yr", amountDisplay: "$79" },
} as const;
