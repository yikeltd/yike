#!/usr/bin/env bash
# Sync Vercel domain verification TXT records for yike.ng in Cloudflare.
# Usage: CLOUDFLARE_API_TOKEN=xxx ./scripts/setup-yike-domain-dns.sh
set -euo pipefail

ZONE_ID="${CLOUDFLARE_ZONE_ID:-048b32f6ff899723ef8ed403546ec1fa}"
TOKEN="${CLOUDFLARE_API_TOKEN:-}"
RECORD_NAME="_vercel"

# From Vercel project yike → Domains (rentovix-3270s-projects)
TXT_VALUES=(
  "vc-domain-verify=yike.ng,21f94a63eb783cf99390"
  "vc-domain-verify=www.yike.ng,ea0dd4779678492e7fd2"
)

if [[ -z "$TOKEN" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN (Zone.DNS Edit for yike.ng)."
  echo ""
  echo "Required TXT records at _vercel.yike.ng:"
  for v in "${TXT_VALUES[@]}"; do echo "  $v"; done
  exit 1
fi

cf_api() {
  curl -s -g "$@" -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json"
}

list_txt() {
  cf_api "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=TXT&name=${RECORD_NAME}.yike.ng" \
    | python3 -c "import sys,json; r=json.load(sys.stdin); print('\n'.join(x['content'] for x in r.get('result',[])))"
}

add_txt() {
  local content="$1"
  local existing
  existing=$(list_txt)
  if echo "$existing" | grep -Fxq "$content"; then
    echo "Already exists: $content"
    return 0
  fi
  echo "Adding TXT: $content"
  cf_api -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
    --data "{\"type\":\"TXT\",\"name\":\"${RECORD_NAME}\",\"content\":\"${content}\",\"ttl\":1}" \
    | python3 -c "import sys,json; r=json.load(sys.stdin); print('OK' if r.get('success') else r)"
}

echo "Cloudflare zone: ${ZONE_ID}"
echo "Checking existing _vercel TXT records..."
list_txt || true
echo ""

for v in "${TXT_VALUES[@]}"; do
  add_txt "$v"
done

echo ""
echo "Done. Wait 1–3 minutes, then run: npm run domain:verify"
