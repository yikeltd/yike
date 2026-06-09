/**
 * Compress app-icon.webp into Yike Crew PWA/TWA icons + UI assets.
 * Run: node scripts/optimize-crew-app-icon.mjs
 */
import sharp from "sharp";
import { mkdir, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INPUT = join(ROOT, "public/images/app-icon.webp");
const STAFF_ICONS = join(ROOT, "public/staff/icons");
const IMAGES = join(ROOT, "public/images");

const NAVY = { r: 3, g: 27, b: 78, alpha: 255 };

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

async function logoOnlyBuffer(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bg = sampleBg(data, info.width, info.height);
  for (let i = 0; i < data.length; i += 4) {
    const d = dist(data[i], data[i + 1], data[i + 2], bg);
    if (d < 48 || (data[i] > 195 && data[i + 1] > 195 && data[i + 2] > 190)) {
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

async function navyLogoTile(logoBuf, size) {
  const logoPx = Math.round(size * 0.72);
  const logo = await sharp(logoBuf)
    .resize(logoPx, logoPx, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  }).composite([{ input: logo, gravity: "centre" }]);
}

async function writeWebp(logoBuf, path, size, quality) {
  await (await navyLogoTile(logoBuf, size))
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(path);
  const { size: bytes } = await stat(path);
  console.log(`  ${path.replace(ROOT, "")} — ${size}px, ${(bytes / 1024).toFixed(1)}KB`);
}

async function writePng(logoBuf, path, size) {
  await (await navyLogoTile(logoBuf, size))
    .png({ compressionLevel: 9, palette: true })
    .toFile(path);
  const { size: bytes } = await stat(path);
  console.log(`  ${path.replace(ROOT, "")} — ${size}px, ${(bytes / 1024).toFixed(1)}KB`);
}

async function main() {
  console.log("Optimizing Yike Crew app icon from app-icon.webp…\n");
  await mkdir(STAFF_ICONS, { recursive: true });

  const input = await sharp(INPUT).rotate().toBuffer();
  const logoBuf = await logoOnlyBuffer(input);
  const meta = await sharp(input).metadata();
  console.log(`Source: ${meta.width}x${meta.height}\n`);

  await writeWebp(logoBuf, join(IMAGES, "crew-icon.webp"), 512, 82);
  await writeWebp(logoBuf, join(IMAGES, "crew-icon-sm.webp"), 192, 78);
  await writeWebp(logoBuf, join(STAFF_ICONS, "crew-192.webp"), 192, 78);
  await writeWebp(logoBuf, join(STAFF_ICONS, "crew-512.webp"), 512, 82);
  await writePng(logoBuf, join(STAFF_ICONS, "crew-192.png"), 192);
  await writePng(logoBuf, join(STAFF_ICONS, "crew-512.png"), 512);

  await sharp(input)
    .resize(1024, 1024, { fit: "cover", position: "centre" })
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(INPUT);
  const { size: masterBytes } = await stat(INPUT);
  console.log(`  ${INPUT.replace(ROOT, "")} — master compressed, ${(masterBytes / 1024).toFixed(1)}KB`);

  console.log("\nDone. Crew icons written to public/images/ and public/staff/icons/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
