#!/usr/bin/env bash
# Retired: separate staging project gyxemepnrkwxocgzfbeo no longer exists.
# Development testing uses the linked Yike Supabase project (hlpojfurfldvcxfxhveg).
set -euo pipefail

echo "db-push-staging.sh is retired (sandbox gyxemepnrkwxocgzfbeo was removed)." >&2
echo "" >&2
echo "For new migrations on the development database:" >&2
echo "  npm run verify:supabase-project -- --require-linked" >&2
echo "  npm run verify:dev-target" >&2
echo "  ALLOW_PRODUCTION_DB_PUSH=1 npm run db:push" >&2
echo "" >&2
echo "ALLOW_PRODUCTION_DB_PUSH confirms you intend to mutate the linked dev database." >&2
exit 1
