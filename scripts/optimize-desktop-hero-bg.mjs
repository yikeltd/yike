/**
 * Optimize a real city photo for the desktop homepage hero.
 * Run: node scripts/optimize-desktop-hero-bg.mjs [source.jpg]
 */
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/images/hero/yike-city-hero.webp");
const DEFAULT_SRC = join(__dirname, "assets/city-candidate-skyline.jpg");

const HERO_W = 1920;
const HERO_H = 900;

export async function optimizeDesktopHeroBackground(
  sourcePath,
  outPath = OUT
) {
  await mkdir(dirname(outPath), { recursive: true });

  await sharp(sourcePath)
    .resize(HERO_W, HERO_H, {
      fit: "cover",
      position: "attention",
    })
    .modulate({ brightness: 0.92, saturation: 1.15 })
    .webp({ quality: 82, effort: 6 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  const { size } = await import("fs/promises").then((fs) =>
    fs.stat(outPath)
  );
  console.log(`  ${outPath} — ${meta.width}x${meta.height}, ${Math.round(size / 1024)}KB`);
}

async function main() {
  const src = process.argv[2] ?? DEFAULT_SRC;
  await optimizeDesktopHeroBackground(src);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
