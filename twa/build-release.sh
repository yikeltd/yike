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

echo "Building signed release APK + AAB (com.yike.app)..."
./gradlew --no-daemon clean bundleRelease assembleRelease

APK_SRC="app/build/outputs/apk/release/app-release.apk"
AAB_SRC="app/build/outputs/bundle/release/app-release.aab"
APK_OUT="app-release-signed.apk"
AAB_OUT="app-release-bundle.aab"

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

echo ""
echo "Build complete."
echo "  APK: $(pwd)/$APK_OUT"
echo "  AAB: $(pwd)/$AAB_OUT"
echo "  Gradle APK: $(pwd)/$APK_SRC"
echo "  Gradle AAB: $(pwd)/$AAB_SRC"
