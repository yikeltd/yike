/**
 * Generates favicon, PWA icons, and social share images from public/images/app-icon.webp
 * Run: node scripts/optimize-brand-assets.mjs
 */
import sharp from "sharp";
import { mkdir, writeFile, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pngToIco from "png-to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INPUT = join(ROOT, "public/images/app-icon.webp");
const OUT_DIR = join(ROOT, "public");
const ICONS_DIR = join(OUT_DIR, "icons");
const APP_DIR = join(ROOT, "src/app");

const NAVY = { r: 3, g: 27, b: 78, alpha: 255 };

async function logFile(path) {
  const { size } = await stat(path);
  console.log(`  ${path.replace(ROOT, "")} — ${(size / 1024).toFixed(1)}KB`);
}

/** Square mark centred on navy — crisp in browser tabs */
async function writeNavyIcon(source, path, size) {
  const logo = await sharp(source)
    .resize(Math.round(size * 0.82), Math.round(size * 0.82), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: NAVY,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(path);
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
  console.log("Optimizing Yike brand assets from app-icon.webp…\n");
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
    await writeNavyIcon(source, join(ICONS_DIR, name), size);
    console.log(`  icons/${name} — ${size}px`);
  }

  const icoBuffers = await Promise.all(
    [16, 32, 48].map(async (s) => {
      const tmp = join(ICONS_DIR, `_ico-${s}.png`);
      await writeNavyIcon(source, tmp, s);
      return sharp(tmp).png().toBuffer();
    })
  );
  const ico = await pngToIco(icoBuffers);
  await writeFile(join(OUT_DIR, "favicon.ico"), ico);
  await writeFile(
    join(OUT_DIR, "apple-touch-icon.png"),
    await sharp(join(ICONS_DIR, "apple-touch-icon.png")).toBuffer()
  );

  await writeNavyIcon(source, join(APP_DIR, "icon.png"), 512);
  await writeNavyIcon(source, join(APP_DIR, "apple-icon.png"), 180);

  const compressedMaster = join(OUT_DIR, "images/_app-icon-master.webp");
  await sharp(source)
    .resize(1024, 1024, { fit: "cover", position: "centre" })
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(compressedMaster);
  await writeFile(INPUT, await sharp(compressedMaster).toBuffer());
  await import("fs/promises").then((fs) => fs.unlink(compressedMaster));
  await logFile(INPUT);

  console.log("\nDone. Favicon, PWA icons, and og-share images updated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
