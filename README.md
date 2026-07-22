# Ward

AI wardrobe architect — learn who you are, define a style system, and rebuild a cohesive wardrobe for every part of your life.

**V1 status:** see [docs/V1_PLAN.md](docs/V1_PLAN.md) and [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- NextAuth (credentials) + Prisma + SQLite (local) / Postgres (prod via Docker or hosted)
- OpenAI optional (local rule-based fallback)
- Stripe subscriptions (dev bypass only outside production)
- Vitest + Playwright + GitHub Actions CI

## Features (v1)

- Style identity onboarding → style system, event blueprint, rebuild roadmap
- Freemium: 1 primary event + top 5 roadmap free; Premium unlocks the rest + purchase-fit
- Edit + regenerate style outputs
- Keep / replace / gap insights from light ownership marks
- Account settings, password reset, billing portal
- Admin metrics, rate limits, privacy & terms

## Setup

```bash
cp .env.example .env
# set AUTH_SECRET
npm install
npx prisma migrate dev
npm run dev
```

Optional Postgres: `docker compose up -d` then point `DATABASE_URL` at Postgres and switch Prisma provider (see `prisma/schema.postgres.snippet.prisma`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run test` | Unit tests |
| `npm run test:e2e` | Playwright smoke |
| `npm run qa` | API soft-launch QA script |
| `npm run build` | Production build |

## Soft launch

1. Run `npm run qa` against a local server
2. Invite early users; collect cohesion feedback on the dashboard
3. Review `/metrics` as an admin (`ADMIN_EMAILS`)
4. Complete `docs/LAUNCH_CHECKLIST.md` before public launch

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md) for Vercel + Postgres + Stripe.
