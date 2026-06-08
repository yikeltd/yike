# Yike Crew — Trusted Web Activity (TWA)

Separate installable APK for internal operations. Does **not** replace the public `com.yike.app` customer build.

| Field | Value |
|-------|--------|
| App name | Yike Crew |
| Package | `ng.yike.staff` |
| Start URL | `https://yike.ng/staff` |
| Manifest | `https://yike.ng/staff/manifest.json` |
| Icon | `https://yike.ng/staff/icons/crew-512.png` |

Regenerate compressed icons from `public/images/app-icon.webp`:

```bash
npm run optimize:crew
```

## Prerequisites

- Production deploy serving `/staff` and `/staff/manifest.json`
- JDK 17+ for Android build
- `@bubblewrap/cli` via `npx`

## 1. Create signing key (one-time)

```bash
keytool -genkeypair -v \
  -keystore twa-staff/android.keystore \
  -alias yike-staff \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Yike Ltd, OU=Crew, O=Yike Ltd, L=Lagos, ST=Lagos, C=NG"
```

## 2. SHA-256 fingerprint → Digital Asset Links

```bash
keytool -list -v -keystore twa-staff/android.keystore -alias yike-staff | grep SHA256
```

Copy the SHA-256 into `public/.well-known/assetlinks.json` for package `ng.yike.staff`, then redeploy.

## 3. Initialize Bubblewrap project

```bash
npm run twa-staff:init
```

## 4. Build signed APK

```bash
npm run twa-staff:build
```

Output: `twa-staff/yike-staff-release.apk`

## Testing checklist

1. APK opens `/staff` (not public homepage)
2. Crew login → role-based workspace
3. App icon shows Yike Crew mark on launcher
4. Non-staff account blocked
5. Public customer APK unchanged (`com.yike.app`)
