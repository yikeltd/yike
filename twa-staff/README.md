# Yike Crew — Trusted Web Activity (TWA)

Package: `ng.yike.staff`  
Launcher name: **Crew**  
Host: `https://yike.ng`  
Start URL: `https://yike.ng/staff`  
Manifest: `https://yike.ng/staff/manifest.json`

Separate from the public customer app (`com.yike.app`).

## Quick links (production)

| What | URL |
|------|-----|
| Crew entry | https://yike.ng/staff |
| Staff login | https://yike.ng/lex?app=staff |
| Install / APK download | https://yike.ng/staff/download |
| Direct APK | https://yike.ng/downloads/yike-crew.apk |
| Asset links | https://yike.ng/.well-known/assetlinks.json |

## Build release APK

From repo root:

```bash
npm run twa-staff:build
```

Requires:

- JDK 17 at `twa/.jdk17` (or `JAVA_HOME`)
- `twa-staff/signing.env` (copy from `signing.env.example`)
- `twa-staff/android.keystore` (same key as customer TWA — alias `yike`)

Output:

- `twa-staff/yike-crew-release.apk` — share via WhatsApp
- `public/downloads/yike-crew.apk` — hosted download after deploy

## Initialize / refresh Bubblewrap project

After production manifest changes:

```bash
npm run twa-staff:init
# or update existing project:
cd twa-staff && npx @bubblewrap/cli update --manifest=https://yike.ng/staff/manifest.json
```

If Bubblewrap init hangs, copy `twa/` Android project into `twa-staff/` and adjust package name + icons (see git history).

## Digital Asset Links

`public/.well-known/assetlinks.json` must include **both**:

- `com.yike.app` (customer)
- `ng.yike.staff` (crew)

Same SHA-256 fingerprint as `twa/android.keystore`.

Verify:

```bash
curl "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://yike.ng&relation=delegate_permission/common.handle_all_urls"
```

## Install for staff

1. Share https://yike.ng/staff/download or the APK file directly.
2. Staff installs, opens **Yike Crew**, signs in at `/lex?app=staff`.
3. App routes to role workspace (support, listings review, trust, etc.).

**Never commit:** `android.keystore`, `signing.env`, `*.apk`, `.jdk17/`.
