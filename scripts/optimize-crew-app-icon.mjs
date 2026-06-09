/**
 * Compress logo.webp into Yike Crew PWA/TWA icons + UI assets.
 * The logo background is preserved for visual consistency with the main app.
 * Run: node scripts/optimize-crew-app-icon.mjs
 */
import sharp from "sharp";
import { mkdir, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INPUT = join(ROOT, "public/images/logo.webp");
const STAFF_ICONS = join(ROOT, "public/staff/icons");
const IMAGES = join(ROOT, "public/images");

async function logoTile(source, size) {
  return sharp(source).resize(size, size, { fit: "cover", position: "centre" });
}

async function writeWebp(source, path, size, quality) {
  await (await logoTile(source, size))
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(path);
  const { size: bytes } = await stat(path);
  console.log(`  ${path.replace(ROOT, "")} — ${size}px, ${(bytes / 1024).toFixed(1)}KB`);
}

async function writePng(source, path, size) {
  await (await logoTile(source, size))
    .png({ compressionLevel: 9, palette: true })
    .toFile(path);
  const { size: bytes } = await stat(path);
  console.log(`  ${path.replace(ROOT, "")} — ${size}px, ${(bytes / 1024).toFixed(1)}KB`);
}

async function main() {
  console.log("Optimizing Yike Crew app icon from logo.webp…\n");
  await mkdir(STAFF_ICONS, { recursive: true });

  const input = await sharp(INPUT).rotate().toBuffer();
  const meta = await sharp(input).metadata();
  console.log(`Source: ${meta.width}x${meta.height}\n`);

  await writeWebp(input, join(IMAGES, "crew-icon.webp"), 512, 82);
  await writeWebp(input, join(IMAGES, "crew-icon-sm.webp"), 192, 78);
  await writeWebp(input, join(STAFF_ICONS, "crew-192.webp"), 192, 78);
  await writeWebp(input, join(STAFF_ICONS, "crew-512.webp"), 512, 82);
  await writePng(input, join(STAFF_ICONS, "crew-192.png"), 192);
  await writePng(input, join(STAFF_ICONS, "crew-512.png"), 512);

  console.log("\nDone. Crew icons written from logo.webp.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
