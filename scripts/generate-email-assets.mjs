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
const previewDir = path.join(root, "public/email/previews");

const NAVY = "#031B4E";
const GOLD = "#E4B547";

const SOCIAL = [
  { key: "tiktok", letter: "T" },
  { key: "x", letter: "X" },
  { key: "youtube", letter: "Y" },
  { key: "instagram", letter: "I" },
  { key: "facebook", letter: "F" },
];

async function ensureDirs() {
  await fs.mkdir(socialDir, { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });
}

async function generateSocialIcon({ key, letter }) {
  const size = 56;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${GOLD}" />
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
        font-size="24" font-weight="800" fill="${NAVY}">${letter}</text>
    </svg>
  `;

  const out = path.join(socialDir, `${key}.png`);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log("wrote", path.relative(root, out));
}

async function writePreviewIndex() {
  const templates = [
    { file: "01-email-verification.html", title: "Email verification" },
    { file: "02-welcome.html", title: "Welcome" },
    { file: "03-admin-alert.html", title: "Admin alert" },
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
  await writePreviewIndex();
  console.log("\nDone. Run: npx tsx scripts/render-email-previews.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
