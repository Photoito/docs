#!/usr/bin/env bash
# 대시보드를 데모 서버에 붙여 띄운다. .env 의 모든 변수를 덮어써 운영 주소가 하나도 남지 않게 한다.
set -euo pipefail
DASH="${1:-$(cd "$(dirname "$0")/../../../photoito-dashboard" && pwd)}"
MOCK="http://127.0.0.1:54330"

export DATABASE_URL="postgres://postgres:postgres@127.0.0.1:54329/postgres"
export DATABASE_REPLICA_URL=""
export NEXT_PUBLIC_API_BASE_URL="$MOCK"
export PHOTOITO_BE_BASE_URL="$MOCK"
export NEXT_PUBLIC_REALTIME_URL="ws://127.0.0.1:54330"
export NEXT_PUBLIC_REALTIME_EDGE_URL="ws://127.0.0.1:54330"
export NEXT_PUBLIC_APP_URL="http://localhost:3411"
export BETTER_AUTH_SECRET="demo-secret-not-real"
export BETTER_AUTH_URL="$MOCK"
export ADMIN_WS_JWT_SECRET="demo-secret-not-real"
export NOTIFICATION_API_KEY=""
export NOTIFICATION_SERVER_URL="$MOCK"
export R2_ENDPOINT="$MOCK"
export R2_ACCESS_KEY_ID="demo"
export R2_SECRET_ACCESS_KEY="demo"
export UPSTASH_REDIS_REST_URL=""
export UPSTASH_REDIS_REST_TOKEN=""
export OPENROUTER_API_KEY=""
export PORTONE_V2_API_SECRET=""
export PORTONE_WEBHOOK_SECRET=""
export NEXT_PUBLIC_PORTONE_STORE_ID=""
export NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY=""
export NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY=""
export BRIDGE_INTERNAL_URL="$MOCK"
export INTERNAL_SHARED_SECRET="demo-secret-not-real"
export DEV_API_ENABLED=""
export R2_SQL_WAREHOUSE=""
export R2_SQL_TOKEN=""
export REVIEW_ACCOUNT_EMAIL=""
export FUNCTIONS_API_KEY=""
export NEXT_PUBLIC_SENTRY_DISABLED="true"
export NEXT_PUBLIC_SENTRY_DSN=""
export NEXT_TELEMETRY_DISABLED=1

# 시계 밀기(fake-clock.cjs) — 데모 서버와 같은 값이어야 한다.
if [ -n "${DEMO_CLOCK_OFFSET_HOURS:-}" ]; then
  export NODE_OPTIONS="--require $(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)/fake-clock.cjs"
fi

cd "$DASH"
exec node node_modules/next/dist/bin/next dev --turbopack -H 127.0.0.1 -p 3411
