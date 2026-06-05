/**
 * Generates optimized Yike brand assets from public/images/logo.png
 * Run: node scripts/optimize-brand-assets.mjs
 */
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pngToIco from "png-to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INPUT = join(ROOT, "public/images/logo.png");
const OUT_DIR = join(ROOT, "public");
const ICONS_DIR = join(OUT_DIR, "icons");

const NAVY = { r: 3, g: 27, b: 78 };

function colorDistance(r, g, b, target) {
  return Math.sqrt(
    (r - target.r) ** 2 + (g - target.g) ** 2 + (b - target.b) ** 2
  );
}

/** Key out navy-ish background pixels for transparent variants */
async function withTransparentBackground(inputBuffer) {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = data;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const dist = colorDistance(r, g, b, NAVY);
    const isDark = r < 60 && g < 80 && b < 120;
    if (dist < 55 || (isDark && dist < 90)) {
      pixels[i + 3] = 0;
    }
  }

  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

async function writeWebp(pipeline, path, width, quality) {
  await pipeline
    .clone()
    .resize(width, width, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(path);
  const meta = await sharp(path).metadata();
  const { size } = await import("fs/promises").then((fs) =>
    fs.stat(path).then((s) => ({ size: s.size }))
  );
  console.log(`  ${path} — ${width}px, ${(size / 1024).toFixed(1)}KB`);
}

async function writePng(pipeline, path, size) {
  await pipeline
    .clone()
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(path);
}

async function main() {
  console.log("Optimizing Yike brand assets…\n");
  await mkdir(ICONS_DIR, { recursive: true });

  const inputBuffer = await sharp(INPUT).toBuffer();
  const transparent = await withTransparentBackground(inputBuffer);

  // Compressed master PNG (replace bloated 1.7MB source)
  await sharp(inputBuffer)
    .resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(OUT_DIR, "images/logo.png"));

  await writeWebp(transparent, join(OUT_DIR, "images/logo.webp"), 512, 82);
  await writeWebp(transparent, join(OUT_DIR, "images/logo-sm.webp"), 192, 78);

  const sizes = [
    { name: "icon-16.png", size: 16 },
    { name: "icon-32.png", size: 32 },
    { name: "icon-48.png", size: 48 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "android-chrome-192.png", size: 192 },
    { name: "android-chrome-512.png", size: 512 },
  ];

  for (const { name, size } of sizes) {
    await writePng(transparent, join(ICONS_DIR, name), size);
  }

  // favicon.ico (16 + 32 + 48)
  const icoBuffers = await Promise.all(
    [16, 32, 48].map((s) =>
      transparent
        .clone()
        .resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  );
  const ico = await pngToIco(icoBuffers);
  await writeFile(join(OUT_DIR, "favicon.ico"), ico);
  await writeFile(join(OUT_DIR, "apple-touch-icon.png"), await sharp(join(ICONS_DIR, "apple-touch-icon.png")).toBuffer());

  console.log("\nDone. Assets written to public/ and public/icons/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
