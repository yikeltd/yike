#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [[ -z "${JAVA_HOME:-}" ]]; then
  LOCAL_JDK="$(find "$PWD/../twa/.jdk17" -path '*/Contents/Home' -type d 2>/dev/null | head -1)"
  if [[ -n "$LOCAL_JDK" ]]; then
    export JAVA_HOME="$LOCAL_JDK"
  fi
fi

if [[ -z "${JAVA_HOME:-}" ]] || ! "$JAVA_HOME/bin/java" -version >/dev/null 2>&1; then
  echo "JDK 17 required. Set JAVA_HOME or install to twa/.jdk17." >&2
  exit 1
fi

if [[ ! -f signing.env ]]; then
  echo "Missing twa-staff/signing.env — copy signing.env.example and set TWA_KEYSTORE_PASSWORD." >&2
  exit 1
fi

if [[ ! -f android.keystore ]]; then
  echo "Missing twa-staff/android.keystore — see README.md" >&2
  exit 1
fi

# shellcheck disable=SC1091
source signing.env

if [[ -z "${TWA_KEYSTORE_PASSWORD:-}" ]]; then
  echo "TWA_KEYSTORE_PASSWORD is empty in signing.env." >&2
  exit 1
fi

export TWA_KEYSTORE_PASSWORD

if [[ ! -f app/build.gradle ]]; then
  echo "Android project missing. Copy from twa/ or run npm run twa-staff:init" >&2
  exit 1
fi

echo "Building signed Yike Crew release APK (ng.yike.staff)..."
./gradlew --no-daemon clean assembleRelease

APK_SRC="app/build/outputs/apk/release/app-release.apk"
APK_OUT="yike-crew-release.apk"

if [[ ! -f "$APK_SRC" ]]; then
  echo "APK not found at $APK_SRC" >&2
  exit 1
fi

cp "$APK_SRC" "$APK_OUT"

PUBLIC_APK="../public/downloads/yike-crew.apk"
mkdir -p "$(dirname "$PUBLIC_APK")"
cp "$APK_SRC" "$PUBLIC_APK"

echo ""
echo "Yike Crew APK ready:"
echo "  Local:  $(pwd)/$APK_OUT"
echo "  Hosted: public/downloads/yike-crew.apk (deploy for https://yike.ng/downloads/yike-crew.apk)"
