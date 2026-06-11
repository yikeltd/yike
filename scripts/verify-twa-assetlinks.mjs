#!/usr/bin/env node
/**
 * Verify Digital Asset Links for com.yike.app (TWA).
 * Run: node scripts/verify-twa-assetlinks.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SITE = "https://yike.ng";
const PACKAGE = "com.yike.app";
const ASSETLINKS_URL = `${SITE}/.well-known/assetlinks.json`;
const DAL_URL = `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=${encodeURIComponent(SITE)}&relation=delegate_permission/common.handle_all_urls`;

function readLocalKeystoreSha() {
  const envPath = join(ROOT, "twa/signing.env");
  const keystore = join(ROOT, "twa/android.keystore");
  if (!existsSync(envPath) || !existsSync(keystore)) return null;
  const pass = readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith("TWA_KEYSTORE_PASSWORD="))
    ?.split("=")
    .slice(1)
    .join("=")
    ?.trim();
  if (!pass) return null;
  try {
    const out = execSync(
      `keytool -list -v -keystore "${keystore}" -alias yike -storepass "${pass}" 2>/dev/null`,
      { encoding: "utf8" }
    );
    const m = out.match(/SHA256:\s*([0-9A-F:]+)/i);
    return m?.[1]?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("Yike TWA / Digital Asset Links check\n");

  const head = await fetch(ASSETLINKS_URL, { method: "HEAD", redirect: "follow" });
  console.log(`assetlinks.json: ${head.status} ${head.headers.get("content-type") ?? ""}`);

  const assetlinks = await (await fetch(ASSETLINKS_URL)).json();
  const yike = assetlinks.find((e) => e.target?.package_name === PACKAGE);
  if (!yike) {
    console.error(`Missing package ${PACKAGE} in assetlinks.json`);
    process.exit(1);
  }

  const hosted = yike.target.sha256_cert_fingerprints.map((f) => f.toUpperCase());
  console.log(`\nHosted fingerprints for ${PACKAGE}:`);
  hosted.forEach((f) => console.log(`  • ${f}`));

  const uploadSha = readLocalKeystoreSha();
  if (uploadSha) {
    console.log(`\nLocal upload keystore SHA-256: ${uploadSha}`);
    console.log(
      uploadSha && hosted.includes(uploadSha)
        ? "  ✓ Upload key is listed in assetlinks.json"
        : "  ✗ Upload key NOT in assetlinks.json — add it"
    );
  } else {
    console.log("\n(Local keystore not checked — twa/signing.env or android.keystore missing)");
  }

  console.log(
    "\nPlay App Signing SHA-256 must also be in assetlinks.json (Play Console → App integrity → App signing key certificate)."
  );

  const dal = await (await fetch(DAL_URL)).json();
  const appStatements = (dal.statements ?? []).filter(
    (s) => s.target?.androidApp?.packageName === PACKAGE
  );
  console.log(`\nGoogle DAL API: ${appStatements.length} statement(s) for ${PACKAGE}`);
  for (const s of appStatements) {
    console.log(`  ✓ ${s.target.androidApp.certificate.sha256Fingerprint}`);
  }

  if (appStatements.length === 0) {
    console.error("\nDAL verification FAILED — TWA will show “Running in Chrome”.");
    process.exit(1);
  }

  console.log("\nWeb-side DAL looks OK. If Play Store still shows Chrome UI:");
  console.log("  1. Confirm Play App Signing SHA-256 is in assetlinks.json");
  console.log("  2. npm run twa:build && upload new AAB to internal testing");
  console.log("  3. Install from Play — not adb debug APK");
  console.log("  4. twa/twa-manifest.json fallbackType must be webview (not customtabs)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
