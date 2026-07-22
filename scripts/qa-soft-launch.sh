#!/usr/bin/env bash
set -euo pipefail

BASE="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
EMAIL="qa-$(date +%s)@example.com"
PASS="password123"
COOKIE_JAR="$(mktemp)"

echo "== Ward soft-launch QA =="
echo "Base: $BASE"
echo "Email: $EMAIL"

curl -sf "$BASE/api/health" | grep -q '"ok":true'
echo "✓ health"

curl -sf -X POST "$BASE/api/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"QA User\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" >/dev/null
echo "✓ signup"

CSRF=$(curl -sf -c "$COOKIE_JAR" "$BASE/api/auth/csrf" | python3 -c 'import sys,json; print(json.load(sys.stdin)["csrfToken"])')
curl -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE/api/auth/callback/credentials?json=true" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "email=$EMAIL" \
  --data-urlencode "password=$PASS" \
  --data-urlencode "redirect=false" \
  --data-urlencode "json=true" >/dev/null
SESSION=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/auth/session")
echo "$SESSION" | grep -q "$EMAIL"
echo "✓ login session"

curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/onboarding" \
  -H 'Content-Type: application/json' \
  -d '{
    "profile":{
      "aestheticRefs":["modern classic"],
      "preferredColors":["navy","charcoal","cream"],
      "avoidColors":[],
      "fitPreferences":{"tops":"structured","bottoms":"tapered","overall":"clean tailored"},
      "climate":"four seasons",
      "budgetTier":"mid",
      "trustedBrands":["Uniqlo"],
      "values":["versatility","polish"]
    },
    "events":[
      {"id":"work","name":"Work week","frequency":"5x","dressCode":"smart casual","priority":1},
      {"id":"weekend","name":"Weekends","frequency":"2x","dressCode":"casual","priority":2}
    ],
    "primaryEventId":"work"
  }' >/dev/null
echo "✓ onboarding generate"

curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/style/regenerate" \
  -H 'Content-Type: application/json' \
  -d '{"target":"system"}' >/dev/null
echo "✓ regenerate system"

UPGRADE=$(curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/stripe/checkout" \
  -H 'Content-Type: application/json' \
  -d '{"interval":"monthly"}')
echo "$UPGRADE" | grep -Eq 'dev_bypass|url'
echo "✓ checkout/dev bypass path"

FIT=$(curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/purchase-check" \
  -H 'Content-Type: application/json' \
  -d '{"description":"Navy tailored wool blazer midweight"}')
echo "$FIT" | grep -q 'score'
echo "✓ purchase-fit"

curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/feedback" \
  -H 'Content-Type: application/json' \
  -d '{"cohesive":4,"comment":"QA pass"}' >/dev/null
echo "✓ feedback"

RESET=$(curl -sf -X POST "$BASE/api/auth/password-reset" \
  -H 'Content-Type: application/json' \
  -d "{\"action\":\"request\",\"email\":\"$EMAIL\"}")
echo "$RESET" | grep -q '"ok":true'
echo "✓ password reset request"

echo "All QA checks passed."
rm -f "$COOKIE_JAR"
