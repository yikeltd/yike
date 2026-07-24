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

## 6. TWA fallback mode

Use `fallbackType: "webview"` in `twa-manifest.json` (not `customtabs`). Custom Tabs show the `yike.ng` URL bar and a top loading line — that reads as a website wrapper, not a native app. WebView fallback keeps a clean shell when Digital Asset Links are still propagating.

If the Play Store build is signed with **Play App Signing**, add the **App signing key certificate** SHA-256 (Play Console → Setup → App signing) to `public/.well-known/assetlinks.json` in addition to your upload key.

## 7. Verify TWA / Digital Asset Links

After deploy + fingerprint update:

```bash
# Should list com.yike.app with both upload + Play App Signing fingerprints
curl "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://yike.ng&relation=delegate_permission/common.handle_all_urls"
```

**If users still see “Running in Chrome”:** Digital Asset Links are failing on their installed build, or the APK was signed with a key not listed in `public/.well-known/assetlinks.json`. Rebuild the TWA (`npm run twa:build` or `twa/build-release.sh`), upload a new AAB to Play Console, and confirm Play App Signing SHA-256 is in assetlinks.

Or use [Statement List Generator](https://developers.google.com/digital-asset-links/tools/generator).

## 8. Review safety notes

- Browse, search, swipe, and listing detail work **without login**
- WhatsApp and call are public intents (no auth wall)
- No aggressive install prompts in-app
- Hotels de-emphasized in main nav (real estate focus)
