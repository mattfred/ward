# Ward V1 Plan

**Goal:** Public web v1 of Ward — identity-first wardrobe architect with freemium + Stripe, production-safe, tested.

**Out of v1:** photo catalog, try-on, social, native apps, human stylists, affiliate-first monetization.

## Definition of done

- [x] Signup → onboarding → style system / blueprint / roadmap
- [x] Free gates: 1 primary event, top 5 roadmap items
- [x] Premium: multi-event, full roadmap, purchase-fit
- [x] No silent Premium upgrade when Stripe is unset in production
- [x] Edit + regenerate style outputs
- [x] Keep / replace / gap insights from ownership
- [x] Account settings + password reset
- [x] Stripe checkout + signed webhooks + customer portal (when configured)
- [x] Admin-only metrics
- [x] Unit + e2e tests + CI workflow
- [x] Privacy + Terms pages
- [x] Launch checklist documented

## Phases completed in codebase

| Phase | Focus | Status |
|-------|--------|--------|
| P0 | Stabilize core loop | Done |
| P1 | Foundations (CI, rate limits, admin metrics, Postgres docs) | Done |
| P2 | Billing truth | Done |
| P3 | Retention depth | Done |
| P4 | Soft-launch testing | Done |
| P5 | Launch packaging | Done |

## Remaining human steps for public launch

1. Provision Postgres + set production env (Stripe live keys, `ADMIN_EMAILS`, `AUTH_SECRET`)
2. Deploy (e.g. Vercel) and run launch checklist
3. Soft-launch to 10–20 users and watch `/metrics`

## Stack (locked)

Next.js App Router · Prisma · SQLite local / Postgres prod · NextAuth credentials · OpenAI + local fallback · Stripe · Vitest · Playwright · GitHub Actions
