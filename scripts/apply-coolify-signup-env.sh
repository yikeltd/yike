#!/usr/bin/env bash
# Apply signup-critical env vars to Coolify via API.
# Requires:
#   COOLIFY_TOKEN          — Coolify API token (Settings → API tokens)
#   COOLIFY_APP_UUID       — Application UUID for yike.ng
#   COOLIFY_BASE_URL       — default https://control.stankings.com
#   ENV_FILE               — default /tmp/yike-ops/coolify-signup-env.json
#
# Does not print secret values.

set -euo pipefail

BASE="${COOLIFY_BASE_URL:-https://control.stankings.com}"
TOKEN="${COOLIFY_TOKEN:-}"
APP="${COOLIFY_APP_UUID:-}"
ENV_FILE="${ENV_FILE:-/tmp/yike-ops/coolify-signup-env.json}"

if [[ -z "$TOKEN" ]]; then
  echo "MISSING: COOLIFY_TOKEN" >&2
  exit 1
fi
if [[ -z "$APP" ]]; then
  echo "MISSING: COOLIFY_APP_UUID" >&2
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "MISSING env file: $ENV_FILE" >&2
  exit 1
fi

node --input-type=module <<'NODE'
import { readFileSync } from 'fs';

const base = process.env.COOLIFY_BASE_URL || 'https://control.stankings.com';
const token = process.env.COOLIFY_TOKEN;
const app = process.env.COOLIFY_APP_UUID;
const envFile = process.env.ENV_FILE || '/tmp/yike-ops/coolify-signup-env.json';
const payload = JSON.parse(readFileSync(envFile, 'utf8'));

const keys = [
  'YIKE_OTP_SERVER_TOKEN',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL',
];

const missing = keys.filter((k) => !payload[k]);
if (missing.length) {
  console.error('env_file_incomplete', missing.join(','));
  process.exit(1);
}

const body = {
  data: keys.map((key) => ({
    key,
    value: payload[key],
    is_preview: false,
    is_literal: true,
  })),
};

const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/applications/${app}/envs/bulk`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify(body),
});

const text = await res.text();
if (!res.ok) {
  console.error('coolify_update_failed', res.status, text.slice(0, 400));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  status: res.status,
  updatedKeys: keys,
  next: 'Restart/redeploy the Coolify application, then curl /api/auth/signup/ready',
}, null, 2));
NODE
