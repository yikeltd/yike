# Yike Staff — Trusted Web Activity (TWA)

Separate installable APK for internal operations staff. Does **not** replace the public `com.yike.app` customer build.

| Field | Value |
|-------|--------|
| App name | Yike Staff |
| Package | `ng.yike.staff` |
| Start URL | `https://yike.ng/staff` |
| Manifest | `https://yike.ng/staff/manifest.json` |

## Prerequisites

- Production (or preview) deploy serving `/staff` and `/staff/manifest.json`
- JDK 17+ for Android build
- `@bubblewrap/cli` via `npx`

## 1. Create signing key (one-time)

```bash
keytool -genkeypair -v \
  -keystore twa-staff/android.keystore \
  -alias yike-staff \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Yike Ltd, OU=Staff, O=Yike Ltd, L=Lagos, ST=Lagos, C=NG"
```

## 2. SHA-256 fingerprint → Digital Asset Links

```bash
keytool -list -v -keystore twa-staff/android.keystore -alias yike-staff | grep SHA256
```

Copy the SHA-256 into `public/.well-known/assetlinks.json` for package `ng.yike.staff`, then redeploy the web app.

## 3. Initialize Bubblewrap project

From repo root (after deploy):

```bash
npm run twa-staff:init
```

Or update an existing project:

```bash
cd twa-staff && npx @bubblewrap/cli update --manifest=https://yike.ng/staff/manifest.json
```

## 4. Build signed APK

```bash
npm run twa-staff:build
```

Output: `twa-staff/app-release-signed.apk`

## Testing checklist

1. APK opens `/staff` (not public homepage)
2. Staff login → role-based workspace
3. Non-staff account blocked
4. Idle lock → PIN unlock (20 min)
5. Admin PIN still required for destructive actions
6. Bottom nav visible on phone, no overlap with content
7. Public customer APK unchanged (`com.yike.app`)
