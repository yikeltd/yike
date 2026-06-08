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

async function writeWebp(input, path, size, quality) {
  await sharp(input)
    .resize(size, size, { fit: "cover", position: "centre" })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(path);
  const { size: bytes } = await stat(path);
  console.log(`  ${path.replace(ROOT, "")} — ${size}px, ${(bytes / 1024).toFixed(1)}KB`);
}

async function writePng(input, path, size) {
  await sharp(input)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(path);
  const { size: bytes } = await stat(path);
  console.log(`  ${path.replace(ROOT, "")} — ${size}px, ${(bytes / 1024).toFixed(1)}KB`);
}

async function main() {
  console.log("Optimizing Yike Crew app icon from app-icon.webp…\n");
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
