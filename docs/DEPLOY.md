# Deploy Ward (V1)

## Recommended stack

- **Host:** Vercel
- **DB:** Neon, Supabase, or Railway Postgres
- **Payments:** Stripe (Checkout + Customer Portal + Webhooks)
- **AI:** OpenAI `gpt-4o-mini` (optional; local fallback works without it)

## 1. Create Postgres

Use any hosted Postgres and copy the connection string.

Local option:

```bash
docker compose up -d
export DATABASE_URL="postgresql://ward:ward@localhost:5432/ward?schema=public"
bash scripts/use-postgres.sh
```

For Vercel production, set `DATABASE_URL` in the project env to your hosted Postgres URL, then **before first deploy** switch the Prisma provider:

```bash
cp prisma/schema.postgresql.prisma prisma/schema.prisma
# commit that change for production branch, or run in CI before migrate
```

> Local/CI can stay on SQLite (`prisma/schema.prisma` provider `sqlite`). Production must use `postgresql`.

## 2. Environment variables (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Public site URL, e.g. `https://ward.vercel.app` |
| `AUTH_TRUST_HOST` | Yes | `true` |
| `ADMIN_EMAILS` | Yes | Your email(s), comma-separated |
| `STRIPE_SECRET_KEY` | Yes (for paid) | Live or test |
| `STRIPE_WEBHOOK_SECRET` | Yes (for paid) | From Stripe webhook endpoint |
| `STRIPE_PRICE_MONTHLY` | Yes (for paid) | Price ID |
| `STRIPE_PRICE_YEARLY` | Yes (for paid) | Price ID |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Future client Stripe.js |
| `OPENAI_API_KEY` | Optional | Richer generation |
| `RESEND_API_KEY` | Recommended | Password-reset email delivery |
| `EMAIL_FROM` | Optional | Verified Resend from address (defaults to `Ward <onboarding@resend.dev>`) |
| `ALLOW_DEV_PREMIUM_BYPASS` | No | Must stay unset/`false` in production |

## 3. Stripe setup

1. Create Products/Prices for monthly ($9.99) and yearly ($79)
2. Enable Customer Portal
3. Add webhook endpoint: `https://YOUR_DOMAIN/api/stripe/webhook`
4. Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## 4. Deploy

```bash
npm i -g vercel
vercel
# set env vars in dashboard or vercel env pull
vercel --prod
```

`vercel.json` runs `prisma migrate deploy` during build.

## 5. Post-deploy smoke

```bash
curl -s https://YOUR_DOMAIN/api/health
PLAYWRIGHT_BASE_URL=https://YOUR_DOMAIN npm run qa
```

Then walk `docs/LAUNCH_CHECKLIST.md`.

## 6. Demo user (optional)

Against any environment with a valid `DATABASE_URL`:

```bash
npx tsx scripts/seed-demo.ts
# default: demo@ward.local / password123
```
