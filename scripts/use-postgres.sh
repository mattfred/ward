#!/usr/bin/env bash
# Switch local Prisma schema to Postgres and create/apply a migration.
# Prerequisites: docker compose up -d  (or a hosted DATABASE_URL)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f prisma/schema.postgresql.prisma ]]; then
  echo "Missing prisma/schema.postgresql.prisma"
  exit 1
fi

cp prisma/schema.postgresql.prisma prisma/schema.prisma

if [[ -z "${DATABASE_URL:-}" ]]; then
  export DATABASE_URL="postgresql://ward:ward@localhost:5432/ward?schema=public"
  echo "Using default DATABASE_URL=$DATABASE_URL"
fi

# Keep .env in sync for Next.js
if grep -q '^DATABASE_URL=' .env 2>/dev/null; then
  sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
else
  echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
fi

npx prisma migrate dev --name postgres_init
npx prisma generate
echo "Postgres schema active. Restart the Next.js server."
