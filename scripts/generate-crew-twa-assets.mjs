/**
 * Yike Crew TWA splash + launcher assets — logo blends into navy (no cream block).
 * Run: node scripts/generate-crew-twa-assets.mjs
 */
import sharp from "sharp";
import { mkdir, stat, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INPUT = join(ROOT, "public/images/app-icon.webp");
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

function dist(r, g, b, t) {
  return Math.sqrt((r - t.r) ** 2 + (g - t.g) ** 2 + (b - t.b) ** 2);
}

function sampleBg(data, width, height) {
  const points = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [x, y] of points) {
    const i = (y * width + x) * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return { r: Math.round(r / 4), g: Math.round(g / 4), b: Math.round(b / 4) };
}

async function logoOnlyBuffer() {
  const { data, info } = await sharp(await sharp(INPUT).rotate().toBuffer())
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bg = sampleBg(data, info.width, info.height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const d = dist(r, g, b, bg);
    if (d < 48 || (r > 195 && g > 195 && b > 190)) {
      data[i + 3] = 0;
    } else if (d < 72) {
      data[i + 3] = Math.round(((d - 48) / 24) * 255);
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function writeBlendedSplash(logoBuf, outPath, size) {
  const logoPx = Math.round(size * 0.52);
  const logo = await sharp(logoBuf)
    .resize(logoPx, logoPx, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
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

async function writeLauncher(logoBuf, outPath, size) {
  const logoPx = Math.round(size * 0.72);
  const logo = await sharp(logoBuf)
    .resize(logoPx, logoPx, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
}

async function main() {
  console.log("Generating Yike Crew TWA assets…\n");
  const logoBuf = await logoOnlyBuffer();

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
