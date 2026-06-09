/**
 * Yike Crew TWA splash + launcher assets from the canonical logo.webp.
 * The logo background is preserved; do not cut out or alpha-mask the mark.
 * Run: node scripts/generate-crew-twa-assets.mjs
 */
import sharp from "sharp";
import { mkdir, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INPUT = join(ROOT, "public/images/logo.webp");
const TWA_RES = join(ROOT, "twa-staff/app/src/main/res");
const STAFF_SPLASH = join(ROOT, "public/staff/splash");

const NAVY = { r: 3, g: 27, b: 78, alpha: 255 };

const SPLASH_DENSITIES = [
  { folder: "drawable-mdpi", size: 320 },
  { folder: "drawable-hdpi", size: 480 },
  { folder: "drawable-xhdpi", size: 720 },
  { folder: "drawable-xxhdpi", size: 960 },
  { folder: "drawable-xxxhdpi", size: 1280 },
];

const LAUNCHER_SIZES = [
  { folder: "mipmap-mdpi", size: 48 },
  { folder: "mipmap-hdpi", size: 72 },
  { folder: "mipmap-xhdpi", size: 96 },
  { folder: "mipmap-xxhdpi", size: 144 },
  { folder: "mipmap-xxxhdpi", size: 192 },
];

async function writeBlendedSplash(source, outPath, size) {
  const logoPx = Math.round(size * 0.52);
  const logo = await sharp(source)
    .resize(logoPx, logoPx, {
      fit: "contain",
      background: NAVY,
    })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function writeLauncher(source, outPath, size) {
  await sharp(source)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
}

async function main() {
  console.log("Generating Yike Crew TWA assets…\n");
  const logoBuf = await sharp(INPUT).rotate().toBuffer();

  for (const { folder, size } of SPLASH_DENSITIES) {
    const dir = join(TWA_RES, folder);
    await mkdir(dir, { recursive: true });
    const path = join(dir, "splash.png");
    await writeBlendedSplash(logoBuf, path, size);
    const { size: bytes } = await stat(path);
    console.log(`  ${folder}/splash.png — ${size}px, ${(bytes / 1024).toFixed(1)}KB`);
  }

  for (const { folder, size } of LAUNCHER_SIZES) {
    const dir = join(TWA_RES, folder);
    await mkdir(dir, { recursive: true });
    await writeLauncher(logoBuf, join(dir, "ic_launcher.png"), size);
    await writeLauncher(logoBuf, join(dir, "ic_maskable.png"), size);
    console.log(`  ${folder}/ic_launcher.png — ${size}px`);
  }

  await writeBlendedSplash(logoBuf, join(ROOT, "twa-staff/store_icon.png"), 512);

  await mkdir(STAFF_SPLASH, { recursive: true });
  const splashSquare = join(STAFF_SPLASH, "_crew-square.png");
  await writeBlendedSplash(logoBuf, splashSquare, 1080);
  await sharp(splashSquare)
    .resize(1080, 1920, {
      fit: "contain",
      background: NAVY,
      position: "centre",
    })
    .png({ compressionLevel: 9 })
    .toFile(join(STAFF_SPLASH, "crew-1080x1920.png"));
  await import("fs/promises").then((fs) => fs.unlink(splashSquare));

  console.log("\nDone. Run npm run twa-staff:build to package the APK.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
