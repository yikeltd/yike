import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SELLER_PLAN_DIR = path.join(process.cwd(), "public/assets/seller-plan");
const WEBP_QUALITY = 88;
const TARGET_WIDTH = 640;

async function optimizeSellerPlanAssets() {
  console.log(`Processing Seller Plan illustrations in: ${SELLER_PLAN_DIR}`);
  const files = fs.readdirSync(SELLER_PLAN_DIR);

  for (const file of files) {
    if (!file.endsWith(".png")) continue;

    const inputPath = path.join(SELLER_PLAN_DIR, file);
    const baseName = path.basename(file, ".png");
    const outputPath = path.join(SELLER_PLAN_DIR, `${baseName}.webp`);

    console.log(`Optimizing: ${file} -> ${baseName}.webp`);

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      await image
        .resize({
          width: Math.min(TARGET_WIDTH, metadata.width || TARGET_WIDTH),
          fit: sharp.fit.contain,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({
          quality: WEBP_QUALITY,
          lossless: false,
          alphaQuality: 90,
          effort: 6,
        })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      const origStats = fs.statSync(inputPath);
      console.log(
        `  ✓ Created ${baseName}.webp (${(stats.size / 1024).toFixed(1)} KB, Original: ${(origStats.size / 1024).toFixed(1)} KB)`
      );
    } catch (err) {
      console.error(`  ✗ Error processing ${file}:`, err);
    }
  }

  console.log("\nSeller Plan illustrations successfully converted to WebP!");
}

optimizeSellerPlanAssets().catch((err) => {
  console.error("Optimization failed:", err);
  process.exit(1);
});
