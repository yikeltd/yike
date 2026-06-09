/**
 * Generates favicon, PWA icons, TWA launcher assets, and share images from public/images/logo.webp.
 * The source logo background is preserved; do not cut out or alpha-mask the mark.
 * Run: node scripts/optimize-brand-assets.mjs
 */
import sharp from "sharp";
import { mkdir, writeFile, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pngToIco from "png-to-ico";
import {
  SPLASH_NAVY,
  writeTwaSplashImage,
  logoMarkPngBuffer,
} from "./lib/logo-splash-mark.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INPUT = join(ROOT, "public/images/logo.webp");
const OUT_DIR = join(ROOT, "public");
const ICONS_DIR = join(OUT_DIR, "icons");
const APP_DIR = join(ROOT, "src/app");
const TWA_RES_DIRS = [
  join(ROOT, "twa/app/src/main/res"),
  join(ROOT, "twa-staff/app/src/main/res"),
];

const NAVY = SPLASH_NAVY;

const TWA_SPLASH_DENSITIES = [
  { folder: "drawable-mdpi", size: 320 },
  { folder: "drawable-hdpi", size: 480 },
  { folder: "drawable-xhdpi", size: 720 },
  { folder: "drawable-xxhdpi", size: 960 },
  { folder: "drawable-xxxhdpi", size: 1280 },
];

const TWA_LAUNCHER_SIZES = [
  { folder: "mipmap-mdpi", size: 48 },
  { folder: "mipmap-hdpi", size: 72 },
  { folder: "mipmap-xhdpi", size: 96 },
  { folder: "mipmap-xxhdpi", size: 144 },
  { folder: "mipmap-xxxhdpi", size: 192 },
];

async function logFile(path) {
  const { size } = await stat(path);
  console.log(`  ${path.replace(ROOT, "")} — ${(size / 1024).toFixed(1)}KB`);
}

async function logoPngBuffer(source, size, fit = "cover") {
  return sharp(source)
    .resize(size, size, { fit, position: "centre", background: NAVY })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Square icon from the full logo artwork; preserves the logo background. */
async function writeLogoIcon(source, path, size) {
  await sharp(await logoPngBuffer(source, size))
    .png({ compressionLevel: 9, palette: true })
    .toFile(path);
}

async function writeTwaSplash(source, path, size) {
  await writeTwaSplashImage(source, path, size);
}

async function writeTwaNativeAssets(source, resDir) {
  for (const { folder, size } of TWA_SPLASH_DENSITIES) {
    const dir = join(resDir, folder);
    await mkdir(dir, { recursive: true });
    await writeTwaSplash(source, join(dir, "splash.png"), size);
  }

  for (const { folder, size } of TWA_LAUNCHER_SIZES) {
    const dir = join(resDir, folder);
    await mkdir(dir, { recursive: true });
    await writeLogoIcon(source, join(dir, "ic_launcher.png"), size);
    await writeLogoIcon(source, join(dir, "ic_maskable.png"), size);
  }
}

/** WhatsApp / Telegram / Facebook link preview (1.91:1) */
async function writeOgShare(source) {
  const logo = await sharp(source)
    .resize(520, 520, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const card = sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: NAVY,
    },
  }).composite([{ input: logo, gravity: "centre" }]);

  await card
    .webp({ quality: 84, effort: 6, smartSubsample: true })
    .toFile(join(OUT_DIR, "images/og-share.webp"));
  await card
    .clone()
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(join(OUT_DIR, "images/og-share.png"));

  await logFile(join(OUT_DIR, "images/og-share.webp"));
  await logFile(join(OUT_DIR, "images/og-share.png"));
}

async function main() {
  console.log("Optimizing Yike brand assets from logo.webp…\n");
  await mkdir(ICONS_DIR, { recursive: true });

  const source = await sharp(INPUT).rotate().toBuffer();
  const meta = await sharp(source).metadata();
  console.log(`Source: ${meta.width}x${meta.height}\n`);

  await sharp(source)
    .resize(512, 512, { fit: "cover", position: "centre" })
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(join(OUT_DIR, "images/logo.webp"));
  await sharp(source)
    .resize(192, 192, { fit: "cover", position: "centre" })
    .webp({ quality: 78, effort: 6, smartSubsample: true })
    .toFile(join(OUT_DIR, "images/logo-sm.webp"));
  await sharp(source)
    .resize(512, 512, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(OUT_DIR, "images/logo.png"));
  await sharp(source)
    .resize(1024, 1024, { fit: "cover", position: "centre" })
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(join(OUT_DIR, "images/app-icon.webp"));

  await logFile(join(OUT_DIR, "images/logo.webp"));
  await logFile(join(OUT_DIR, "images/logo-sm.webp"));

  await writeOgShare(source);

  const sizes = [
    { name: "icon-16.png", size: 16 },
    { name: "icon-32.png", size: 32 },
    { name: "icon-48.png", size: 48 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "android-chrome-192.png", size: 192 },
    { name: "android-chrome-512.png", size: 512 },
  ];

  for (const { name, size } of sizes) {
    await writeLogoIcon(source, join(ICONS_DIR, name), size);
    console.log(`  icons/${name} — ${size}px`);
  }

  const icoBuffers = await Promise.all(
    [16, 32, 48].map(async (s) => {
      const tmp = join(ICONS_DIR, `_ico-${s}.png`);
      await writeLogoIcon(source, tmp, s);
      return sharp(tmp).png().toBuffer();
    })
  );
  const ico = await pngToIco(icoBuffers);
  await writeFile(join(OUT_DIR, "favicon.ico"), ico);
  await writeFile(
    join(OUT_DIR, "apple-touch-icon.png"),
    await sharp(join(ICONS_DIR, "apple-touch-icon.png")).toBuffer()
  );

  await writeLogoIcon(source, join(APP_DIR, "icon.png"), 512);
  await writeLogoIcon(source, join(APP_DIR, "apple-icon.png"), 180);

  const mark512 = await logoMarkPngBuffer(source, 512);
  await sharp(mark512)
    .webp({ quality: 86, effort: 6, smartSubsample: true })
    .toFile(join(OUT_DIR, "images/logo-mark.webp"));

  for (const resDir of TWA_RES_DIRS) {
    await writeTwaNativeAssets(source, resDir);
    console.log(`  ${resDir.replace(ROOT, "")}/ launcher + splash assets`);
  }

  await logFile(INPUT);
  await logFile(join(OUT_DIR, "images/app-icon.webp"));

  console.log("\nDone. Favicon, PWA, TWA, and og-share images updated from logo.webp.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
