#!/usr/bin/env bash
# Trigger Vercel to re-check yike.ng / www.yike.ng DNS verification.
set -euo pipefail

AUTH="/Users/stanlex/Library/Application Support/com.vercel.cli/auth.json"
TOKEN=$(python3 -c "import json; print(json.load(open('$AUTH'))['token'])")
TEAM="team_8loZbhpplfWxKOrD7q6wzHfm"

for domain in yike.ng www.yike.ng; do
  echo "Verifying $domain..."
  curl -s -X POST "https://api.vercel.com/v9/projects/yike/domains/${domain}/verify?teamId=${TEAM}" \
    -H "Authorization: Bearer ${TOKEN}" | python3 -m json.tool
done

echo "Checking HTTPS..."
curl -sI https://yike.ng 2>&1 | head -8 || true
