# Yike — Trusted Web Activity (TWA) / Google Play

Package: `com.yike.app`  
Host: `https://yike.ng`  
Manifest: `https://yike.ng/manifest.json`

## Prerequisites

- Node.js 18+
- JDK 11+ (for Android build)
- `@bubblewrap/cli` (installed via `npx`)

## 1. Deploy web app first

TWA wraps the live PWA. Ensure production serves:

- `https://yike.ng/manifest.json`
- `https://yike.ng/.well-known/assetlinks.json`
- `https://yike.ng/icons/android-chrome-512.png`

## 2. Create Android signing key (one-time)

```bash
keytool -genkeypair -v \
  -keystore twa/android.keystore \
  -alias yike \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Yike Ltd, OU=Mobile, O=Yike Ltd, L=Lagos, ST=Lagos, C=NG"
```

**Keep `android.keystore` and passwords offline — never commit the keystore.**

## 3. Get SHA-256 fingerprint

```bash
keytool -list -v -keystore twa/android.keystore -alias yike | grep SHA256
```

Copy the SHA-256 value (colon-separated) into:

`public/.well-known/assetlinks.json` → replace `REPLACE_WITH_RELEASE_SIGNING_SHA256`

Redeploy the web app so Digital Asset Links validate.

## 4. Initialize / update Bubblewrap project

From repo root (after production deploy):

```bash
npm run twa:init
# or, if project already exists in twa/:
cd twa && npx @bubblewrap/cli update --manifest=https://yike.ng/manifest.json
```

Edit `twa/twa-manifest.json` if needed, then:

```bash
cd twa && npx @bubblewrap/cli build
```

Output: `twa/app-release-signed.apk` or `.aab` (upload `.aab` to Play Console).

## 5. Play Console — closed testing checklist

| Field | Value |
|-------|--------|
| App name | Yike |
| Package | com.yike.app |
| Category | House & Home |
| Pricing | Free |
| Default language | English (United States) |
| Privacy policy | https://yike.ng/privacy |
| Terms | https://yike.ng/terms |
| Account deletion | https://yike.ng/account/delete |
| Moderation | https://yike.ng/moderation |
| Support email | hello@yike.ng |
| Support phone/WhatsApp | +234 803 514 3299 |

Store assets (in `public/store/`):

- `android-chrome-512.png` (via `public/icons/`) — high-res icon
- `feature-graphic-1024x500.png` — feature graphic
- `01-home-search.png` … `04-trust-safety.png` — phone screenshots

Store listing copy: see `twa/play-store-listing.txt`.

## 6. Verify TWA / Digital Asset Links

After deploy + fingerprint update:

```bash
# Should return success for com.yike.app
curl "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://yike.ng&relation=delegate_permission/common.handle_all_urls"
```

Or use [Statement List Generator](https://developers.google.com/digital-asset-links/tools/generator).

## 7. Review safety notes

- Browse, search, swipe, and listing detail work **without login**
- WhatsApp and call are public intents (no auth wall)
- No aggressive install prompts in-app
- Hotels de-emphasized in main nav (real estate focus)
