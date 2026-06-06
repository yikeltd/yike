/**
 * Google Play / PWA store assets — splash + phone screenshots.
 * Run: node scripts/generate-store-assets.mjs
 */
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LOGO = join(ROOT, "public/images/logo.webp");
const OUT = join(ROOT, "public/store");
const SPLASH_OUT = join(ROOT, "public/splash");

const NAVY = "#031B4E";
const GOLD = "#E4B547";

const SCREENSHOTS = [
  {
    file: "01-home-search.png",
    title: "Find real homes",
    subtitle: "Search by city, area & budget",
  },
  {
    file: "02-swipe-browse.png",
    title: "Swipe homes",
    subtitle: "Save favourites · Skip the rest",
  },
  {
    file: "03-listing-detail.png",
    title: "Verified listings",
    subtitle: "WhatsApp agents in one tap",
  },
  {
    file: "04-trust-safety.png",
    title: "Trust-first",
    subtitle: "Report scams · Verified listers",
  },
];

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function screenshotSvg(title, subtitle, w, h) {
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="#021433"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="48" y="120" width="${w - 96}" height="${h - 280}" rx="32" fill="white" fill-opacity="0.08"/>
  <rect x="48" y="${h - 200}" width="${w - 96}" height="120" rx="24" fill="${GOLD}" fill-opacity="0.15"/>
  <text x="${w / 2}" y="${h - 130}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="42" font-weight="700" fill="white">${escapeXml(title)}</text>
  <text x="${w / 2}" y="${h - 78}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" fill="rgba(255,255,255,0.75)">${escapeXml(subtitle)}</text>
  <text x="${w / 2}" y="80" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="${GOLD}">YIKE.NG</text>
</svg>`);
}

function splashSvg(w, h) {
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${NAVY}"/>
  <circle cx="${w / 2}" cy="${h * 0.42}" r="120" fill="${GOLD}" fill-opacity="0.12"/>
  <text x="${w / 2}" y="${h * 0.58}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="white">Yike</text>
  <text x="${w / 2}" y="${h * 0.62}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="rgba(255,255,255,0.7)">Find real houses in Nigeria</text>
</svg>`);
}

async function compositeLogo(basePipeline, logoSize, left, top) {
  const logo = await sharp(LOGO)
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();
  return basePipeline.composite([{ input: logo, left, top }]);
}

async function main() {
  console.log("Generating store assets…\n");
  await mkdir(OUT, { recursive: true });
  await mkdir(SPLASH_OUT, { recursive: true });

  const phoneW = 1080;
  const phoneH = 1920;

  for (const shot of SCREENSHOTS) {
    let pipeline = sharp(screenshotSvg(shot.title, shot.subtitle, phoneW, phoneH));
    pipeline = await compositeLogo(pipeline, 200, (phoneW - 200) / 2, 420);
    await pipeline.png().toFile(join(OUT, shot.file));
    console.log(`  store/${shot.file}`);
  }

  const splashSizes = [
    { name: "splash-1170x2532.png", w: 1170, h: 2532 },
    { name: "splash-1284x2778.png", w: 1284, h: 2778 },
    { name: "splash-1080x1920.png", w: 1080, h: 1920 },
  ];

  for (const { name, w, h } of splashSizes) {
    let pipeline = sharp(splashSvg(w, h));
    const logoSize = Math.round(w * 0.22);
    pipeline = await compositeLogo(
      pipeline,
      logoSize,
      Math.round((w - logoSize) / 2),
      Math.round(h * 0.38)
    );
    await pipeline.png().toFile(join(SPLASH_OUT, name));
    console.log(`  splash/${name}`);
  }

  const featureW = 1024;
  const featureH = 500;
  let feature = sharp(
    Buffer.from(`<svg width="${featureW}" height="${featureH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="#021433"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#fg)"/>
  <circle cx="820" cy="120" r="180" fill="${GOLD}" fill-opacity="0.12"/>
  <text x="80" y="200" font-family="system-ui,sans-serif" font-size="56" font-weight="800" fill="white">Yike</text>
  <text x="80" y="270" font-family="system-ui,sans-serif" font-size="28" fill="rgba(255,255,255,0.8)">Find real homes in Nigeria</text>
  <text x="80" y="340" font-family="system-ui,sans-serif" font-size="22" fill="${GOLD}">Swipe · Search · WhatsApp agents</text>
</svg>`)
  );
  feature = await compositeLogo(feature, 120, featureW - 200, 190);
  await feature.png().toFile(join(OUT, "feature-graphic-1024x500.png"));
  console.log("  store/feature-graphic-1024x500.png");

  console.log("\nDone. Upload public/store/*.png to Google Play screenshots.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
