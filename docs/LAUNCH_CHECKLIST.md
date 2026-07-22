# Ward V1 Launch Checklist

Full deploy instructions: [DEPLOY.md](./DEPLOY.md)

## Pre-launch

- [ ] `npm run test` green
- [ ] `npm run test:e2e` green (or `scripts/qa-soft-launch.sh` against running server)
- [ ] `npm run build` green
- [ ] `GET /api/health` returns `{ ok: true }`
- [ ] Production uses Postgres (`cp prisma/schema.postgresql.prisma prisma/schema.prisma` then migrate)
- [ ] Production `DATABASE_URL` points to Postgres
- [ ] `AUTH_SECRET` set to a long random value
- [ ] `NEXTAUTH_URL` / `AUTH_URL` is the public URL
- [ ] `ADMIN_EMAILS` set to your email(s)
- [ ] `ALLOW_DEV_PREMIUM_BYPASS` is **not** true in production
- [ ] Stripe live keys + monthly/yearly price IDs + webhook secret configured
- [ ] Stripe Customer Portal enabled in Stripe Dashboard
- [ ] Optional: `OPENAI_API_KEY` for richer generation
- [ ] `RESEND_API_KEY` (+ verified `EMAIL_FROM`) for password-reset emails
- [ ] Privacy (`/privacy`) and Terms (`/terms`) reviewed
- [ ] Soft-launch cohesion feedback reviewed on `/metrics`
- [ ] Optional demo user: `npm run seed`

## Post-launch smoke

- [ ] Signup + onboarding on production URL
- [ ] Free gates visible (1 event, top 5 roadmap)
- [ ] Real Stripe checkout completes and unlocks Premium
- [ ] Billing portal opens from Account
- [ ] Password reset email path verified (or logged in provider)
- [ ] Regenerate + edit style system works
- [ ] Keep/replace/gaps updates after ownership changes
- [ ] `curl https://YOUR_DOMAIN/api/health` healthy

## Done when

V1 definition in `docs/V1_PLAN.md` checkboxes are satisfied and soft-launch metrics show healthy onboarding completion without billing incidents.
