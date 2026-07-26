/**
 * Production desktop homepage hero from public/images/hero.png.
 * Exact pixel dimensions — no resize, no crop, no stretch.
 * Visually lossless WebP; metadata stripped; PNG master retained.
 *
 * Run: node scripts/optimize-production-hero.mjs
 */
import sharp from "sharp";
import { mkdir, stat, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public/images/hero.png");
const PRIMARY_OUT = join(ROOT, "public/images/hero.webp");
const RESPONSIVE_DIR = join(ROOT, "public/images/hero");

/** Visually lossless — high quality, no dimension change. */
const QUALITY = 92;

async function logFile(path) {
  const { size } = await stat(path);
  const meta = await sharp(path).metadata();
  console.log(
    `  ${path.replace(ROOT, "")} — ${meta.width}x${meta.height}, ${(size / 1024).toFixed(1)}KB`,
  );
  return { path, width: meta.width, height: meta.height, bytes: size };
}

async function main() {
  const srcMeta = await sharp(SRC).metadata();
  console.log(
    `Source: hero.png ${srcMeta.width}x${srcMeta.height} (${srcMeta.format})`,
  );

  if (!srcMeta.width || !srcMeta.height) {
    throw new Error("Invalid source dimensions");
  }

  await mkdir(RESPONSIVE_DIR, { recursive: true });

  // Exact dimensions — no .resize(), no crop, no stretch
  await sharp(SRC)
    .rotate() // honour EXIF then strip
    .webp({
      quality: QUALITY,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: false,
      nearLossless: false,
    })
    .toFile(PRIMARY_OUT);

  const primary = await logFile(PRIMARY_OUT);

  if (
    primary.width !== srcMeta.width ||
    primary.height !== srcMeta.height
  ) {
    throw new Error(
      `Dimension mismatch: expected ${srcMeta.width}x${srcMeta.height}, got ${primary.width}x${primary.height}`,
    );
  }

  const manifest = {
    source: "/images/hero.png",
    primary: "/images/hero.webp",
    quality: QUALITY,
    resized: false,
    cropped: false,
    exactDimensions: true,
    width: srcMeta.width,
    height: srcMeta.height,
    aspectRatio: `${srcMeta.width}/${srcMeta.height}`,
    generatedAt: new Date().toISOString(),
    bytes: primary.bytes,
  };

  await writeFile(
    join(RESPONSIVE_DIR, "hero-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );

  console.log("Done. Original PNG preserved. Exact dimensions verified.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
