#!/usr/bin/env bash
# Push NEW local migrations to production Supabase (hlpojfurfldvcxfxhveg).
# Prefer Supabase SQL Editor for one-off applies — no token required.
# Only run when supabase/migrations/ has files not yet on production.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="${SUPABASE_PROJECT_REF:-hlpojfurfldvcxfxhveg}"
PRODUCTION_REF="hlpojfurfldvcxfxhveg"

if [[ -f .env.local ]]; then
  set +u
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
  set -u
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN." >&2
  echo "Prefer applying new SQL via Supabase SQL Editor:" >&2
  echo "  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new" >&2
  echo "Or add SUPABASE_ACCESS_TOKEN to .env.local (local machine only — never paste in chat)." >&2
  exit 1
fi

export SUPABASE_ACCESS_TOKEN

if [[ ! -d supabase/migrations ]]; then
  echo "No supabase/migrations directory found." >&2
  exit 1
fi

echo "Verifying Supabase project identity..."
node scripts/verify-supabase-project.mjs --require-linked

if [[ "$PROJECT_REF" == "$PRODUCTION_REF" && "${ALLOW_PRODUCTION_DB_PUSH:-}" != "1" ]]; then
  echo "Refusing db push to linked project ${PROJECT_REF}." >&2
  echo "Pre-launch development uses this same Supabase project — set ALLOW_PRODUCTION_DB_PUSH=1 only after reviewing new migration SQL." >&2
  echo "See docs/engineering/DEV_E2E_CERTIFICATION.md" >&2
  exit 1
fi

echo "Linking Supabase project ${PROJECT_REF}..."
supabase link --project-ref "$PROJECT_REF" --yes

echo "Applying migrations..."
supabase db push --include-all --yes

echo ""
echo "Migration status:"
supabase migration list
