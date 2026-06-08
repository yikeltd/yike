#!/usr/bin/env node
/**
 * Generates email social icons + static HTML previews.
 * Run: node scripts/generate-email-assets.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const socialDir = path.join(root, "public/email/social");
const badgesDir = path.join(root, "public/email/badges");
const previewDir = path.join(root, "public/email/previews");

/** Brand marks from Simple Icons (MIT) — white glyph on official brand color. */
const SOCIAL = [
  { key: "tiktok", brandColor: "#000000", slug: "tiktok" },
  { key: "x", brandColor: "#000000", slug: "x" },
  { key: "youtube", brandColor: "#FF0000", slug: "youtube" },
  { key: "instagram", brandColor: "#E4405F", slug: "instagram" },
  { key: "facebook", brandColor: "#1877F2", slug: "facebook" },
];

async function ensureDirs() {
  await fs.mkdir(socialDir, { recursive: true });
  await fs.mkdir(badgesDir, { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });
}

/** Lock badge artwork height — width follows source aspect after trim. */
const BADGE_HEIGHT = 40;

/**
 * Trim source padding, scale to full badge height (no letterboxing).
 * `contain` inside a fixed 120×40 box shrinks Google Play to ~36px tall.
 */
async function normalizeStoreBadge(input, { density } = {}) {
  const pipeline = density ? sharp(input, { density }) : sharp(input);
  const trimmed = await pipeline.trim({ threshold: 12 }).toBuffer();

  return sharp(trimmed)
    .resize({ height: BADGE_HEIGHT })
    .png()
    .toBuffer();
}

/** Official App Store + Google Play badge PNGs for email footers. */
async function generateStoreBadges() {
  const appSvg = await fetch(
    "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83"
  ).then((r) => r.arrayBuffer());
  const playPng = await fetch(
    "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
  ).then((r) => r.arrayBuffer());

  const appOut = path.join(badgesDir, "app-store.png");
  const playOut = path.join(badgesDir, "google-play.png");

  const appBuf = await normalizeStoreBadge(Buffer.from(appSvg), { density: 300 });
  const playBuf = await normalizeStoreBadge(Buffer.from(playPng));

  await sharp(appBuf).toFile(appOut);
  await sharp(playBuf).toFile(playOut);

  const appMeta = await sharp(appBuf).metadata();
  const playMeta = await sharp(playBuf).metadata();
  const manifest = {
    appStore: { width: appMeta.width, height: appMeta.height },
    googlePlay: { width: playMeta.width, height: playMeta.height },
  };
  const manifestPath = path.join(root, "src/lib/email/badge-dimensions.json");
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log("wrote", path.relative(root, appOut), `${appMeta.width}x${appMeta.height}`);
  console.log("wrote", path.relative(root, playOut), `${playMeta.width}x${playMeta.height}`);
  console.log("wrote", path.relative(root, manifestPath));
}

async function generateSocialIcon({ key, brandColor, slug }) {
  const size = 56;
  const iconSize = 30;
  const pad = Math.round((size - iconSize) / 2);

  const iconSvg = await fetch(
    `https://cdn.simpleicons.org/${slug}/ffffff`
  ).then((r) => {
    if (!r.ok) throw new Error(`Failed to fetch ${slug} icon: ${r.status}`);
    return r.text();
  });

  const iconBuffer = await sharp(Buffer.from(iconSvg), { density: 300 })
    .resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const circle = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${brandColor}" />
    </svg>`
  );

  const out = path.join(socialDir, `${key}.png`);
  await sharp(circle)
    .composite([{ input: iconBuffer, top: pad, left: pad }])
    .png()
    .toFile(out);
  console.log("wrote", path.relative(root, out));
}

async function writePreviewIndex() {
  const templates = [
    { file: "00-otp-signup.html", title: "OTP signup" },
    { file: "00-otp-login.html", title: "OTP login" },
    { file: "01-email-verification.html", title: "Email verification" },
    { file: "02-welcome.html", title: "Welcome" },
    { file: "12-admin-report.html", title: "Admin report alert" },
    { file: "13-admin-listing.html", title: "Admin listing alert" },
    { file: "14-admin-agent.html", title: "Admin agent alert" },
  ];

  const links = templates
    .map(
      (t) =>
        `<li><a href="./${t.file}" style="color:#031B4E;font-weight:600;">${t.title}</a></li>`
    )
    .join("\n");

  const index = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Yike email previews</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f4f6f9; margin: 0; padding: 32px 20px; color: #031B4E; }
    main { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 28px 32px; border: 1px solid #e2e8f0; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { color: #64748b; line-height: 1.5; }
    ul { margin: 20px 0 0; padding-left: 20px; line-height: 2; }
  </style>
</head>
<body>
  <main>
    <h1>Yike transactional emails</h1>
    <p>Static previews generated from <code>src/lib/email/templates</code>.</p>
    <ul>${links}</ul>
  </main>
</body>
</html>`;

  await fs.writeFile(path.join(previewDir, "index.html"), index, "utf8");
  console.log("wrote", path.relative(root, path.join(previewDir, "index.html")));
}

async function main() {
  await ensureDirs();
  for (const item of SOCIAL) {
    await generateSocialIcon(item);
  }
  await generateStoreBadges();
  await writePreviewIndex();
  console.log("\nDone. Run: npx tsx scripts/render-email-previews.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
