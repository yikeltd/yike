#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [[ -z "${JAVA_HOME:-}" ]]; then
  LOCAL_JDK="$(find "$PWD/.jdk17" -path '*/Contents/Home' -type d 2>/dev/null | head -1)"
  if [[ -n "$LOCAL_JDK" ]]; then
    export JAVA_HOME="$LOCAL_JDK"
  fi
fi

if [[ -z "${JAVA_HOME:-}" ]] || ! "$JAVA_HOME/bin/java" -version >/dev/null 2>&1; then
  echo "JDK 17 required. Set JAVA_HOME or run: curl + extract to twa/.jdk17 (see README)." >&2
  exit 1
fi

if [[ ! -f signing.env ]]; then
  echo "Missing twa/signing.env — copy signing.env.example and set TWA_KEYSTORE_PASSWORD." >&2
  exit 1
fi

if [[ ! -f android.keystore ]]; then
  echo "Missing twa/android.keystore — see README.md for key generation." >&2
  exit 1
fi

# shellcheck disable=SC1091
source signing.env

if [[ -z "${TWA_KEYSTORE_PASSWORD:-}" ]]; then
  echo "TWA_KEYSTORE_PASSWORD is empty in signing.env." >&2
  exit 1
fi

export TWA_KEYSTORE_PASSWORD

node <<'NODE'
const fs = require("fs");

const manifest = JSON.parse(fs.readFileSync("twa-manifest.json", "utf8"));
const gradlePath = "app/build.gradle";
let gradle = fs.readFileSync(gradlePath, "utf8");

const replacements = [
  [/splashScreenFadeOutDuration: \d+/, `splashScreenFadeOutDuration: ${manifest.splashScreenFadeOutDuration}`],
  [/fallbackType: '[^']+'/, `fallbackType: '${manifest.fallbackType}'`],
  [/enableSiteSettingsShortcut: '[^']+'/, `enableSiteSettingsShortcut: '${String(manifest.enableSiteSettingsShortcut)}'`],
  [/versionCode \d+/, `versionCode ${manifest.appVersionCode}`],
  [/versionName "[^"]+"/, `versionName "${manifest.appVersionName}"`],
];

for (const [pattern, value] of replacements) {
  if (!pattern.test(gradle)) {
    throw new Error(`Could not sync ${pattern} in ${gradlePath}`);
  }
  gradle = gradle.replace(pattern, value);
}

fs.writeFileSync(gradlePath, gradle);

const manifestPath = "app/src/main/AndroidManifest.xml";
let androidManifest = fs.readFileSync(manifestPath, "utf8");
androidManifest = androidManifest.replace(/\n\s+android:pathPrefix="\/"\s*/g, " ");
fs.writeFileSync(manifestPath, androidManifest);
NODE

node <<'NODE'
const sharp = require("sharp");

const targets = [
  ["app/src/main/res/drawable-mdpi/splash.png", 320],
  ["app/src/main/res/drawable-hdpi/splash.png", 480],
  ["app/src/main/res/drawable-xhdpi/splash.png", 720],
  ["app/src/main/res/drawable-xxhdpi/splash.png", 960],
  ["app/src/main/res/drawable-xxxhdpi/splash.png", 1280],
];

// Keep Android/TWA's native launch phase logo-free; the web app owns the branded full-screen splash.
Promise.all(
  targets.map(([out, size]) =>
    sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 3, g: 27, b: 78, alpha: 0 },
      },
    })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(out)
  )
).catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE

echo "Building signed release APK + AAB (com.yike.app)..."
./gradlew --no-daemon clean bundleRelease assembleRelease

APK_SRC="app/build/outputs/apk/release/app-release.apk"
AAB_SRC="app/build/outputs/bundle/release/app-release.aab"
APK_OUT="app-release-signed.apk"
AAB_OUT="app-release-bundle.aab"
PUBLIC_APK="../public/downloads/yike.apk"

if [[ ! -f "$APK_SRC" ]]; then
  echo "APK not found at $APK_SRC" >&2
  exit 1
fi
if [[ ! -f "$AAB_SRC" ]]; then
  echo "AAB not found at $AAB_SRC" >&2
  exit 1
fi

cp "$APK_SRC" "$APK_OUT"
cp "$AAB_SRC" "$AAB_OUT"
mkdir -p "$(dirname "$PUBLIC_APK")"
cp "$APK_SRC" "$PUBLIC_APK"

echo ""
echo "Build complete."
echo "  APK: $(pwd)/$APK_OUT"
echo "  AAB: $(pwd)/$AAB_OUT"
echo "  Hosted APK: public/downloads/yike.apk (deploy for https://yike.ng/downloads/yike.apk)"
echo "  Gradle APK: $(pwd)/$APK_SRC"
echo "  Gradle AAB: $(pwd)/$AAB_SRC"
