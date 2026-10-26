/**
 * Generates favicon, PWA icons, TWA launcher assets, and share images from
 * public/icons/logo.png (source of truth). Master WebP: public/icons/logo.webp.
 * Run: node scripts/optimize-brand-assets.mjs
 */
import sharp from "sharp";
import { mkdir, writeFile, stat, access } from "fs/promises";
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
const SOURCE_PNG = join(ROOT, "public/icons/logo.png");
const MASTER_WEBP = join(ROOT, "public/icons/logo.webp");
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
  let pipeline = sharp(await logoPngBuffer(source, size));
  if (size <= 48) {
    pipeline = pipeline.sharpen({ sigma: 0.6, m1: 0.5, m2: 0.25 });
  }
  await pipeline.png({ compressionLevel: 9, palette: size <= 48 }).toFile(path);
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

async function writeOgShare(source) {
  const card = sharp(source)
    .resize(1200, 630, {
      fit: "contain",
      position: "centre",
      background: NAVY,
    })
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      background: NAVY,
    });

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
  await access(SOURCE_PNG);
  console.log("Optimizing Yike brand assets from public/icons/logo.png…\n");
  await mkdir(ICONS_DIR, { recursive: true });

  const source = await sharp(SOURCE_PNG).rotate().toBuffer();
  const meta = await sharp(source).metadata();
  console.log(`Source PNG: ${meta.width}x${meta.height} (alpha: ${meta.hasAlpha})\n`);

  await sharp(source)
    .webp({ quality: 88, effort: 6, smartSubsample: true, lossless: false })
    .toFile(MASTER_WEBP);

  await sharp(source)
    .resize(512, 512, { fit: "cover", position: "centre" })
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(join(OUT_DIR, "images/logo.webp"));
  await sharp(source)
    .resize(192, 192, { fit: "cover", position: "centre" })
    .webp({ quality: 78, effort: 6, smartSubsample: true })
    .toFile(join(OUT_DIR, "images/logo-sm.webp"));
  await sharp(source)
    .resize(192, 192, { fit: "cover", position: "centre" })
    .webp({ quality: 78, effort: 6, smartSubsample: true })
    .toFile(join(ICONS_DIR, "logo-sm.webp"));
  await sharp(source)
    .resize(512, 512, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(OUT_DIR, "images/logo.png"));
  await sharp(source)
    .resize(1024, 1024, { fit: "cover", position: "centre" })
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(join(OUT_DIR, "images/app-icon.webp"));

  await logFile(SOURCE_PNG);
  await logFile(MASTER_WEBP);
  await logFile(join(ICONS_DIR, "logo-sm.webp"));
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
  /** Next.js App Router serves tab favicon from src/app/favicon.ico — must stay in sync with public/. */
  await writeFile(join(APP_DIR, "favicon.ico"), ico);
  await writeFile(
    join(OUT_DIR, "apple-touch-icon.png"),
    await sharp(join(ICONS_DIR, "apple-touch-icon.png")).toBuffer()
  );

  await writeLogoIcon(source, join(APP_DIR, "icon.png"), 512);
  await writeLogoIcon(source, join(APP_DIR, "apple-icon.png"), 180);
  await logFile(join(APP_DIR, "favicon.ico"));
  await logFile(join(APP_DIR, "icon.png"));
  await logFile(join(APP_DIR, "apple-icon.png"));

  const mark512 = await logoMarkPngBuffer(source, 512);
  await sharp(mark512)
    .webp({ quality: 86, effort: 6, smartSubsample: true })
    .toFile(join(OUT_DIR, "images/logo-mark.webp"));

  for (const resDir of TWA_RES_DIRS) {
    await writeTwaNativeAssets(source, resDir);
    console.log(`  ${resDir.replace(ROOT, "")}/ launcher + splash assets`);
  }

  await logFile(join(OUT_DIR, "images/app-icon.webp"));

  console.log("\nDone. Master logo at public/icons/logo.webp; favicons and PWA assets regenerated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
