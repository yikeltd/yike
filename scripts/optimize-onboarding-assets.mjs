import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const CARS_DIR = path.join(process.cwd(), "public/assets/onboarding/cars");
const PROPS_DIR = path.join(process.cwd(), "public/assets/onboarding/props");

// Target dimensions: 2x resolution for 320x220 container
const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 440;
const WEBP_QUALITY = 85;

async function processDirectory(dirPath, filenameMap = {}) {
  const files = fs.readdirSync(dirPath);
  console.log(`Processing directory: ${dirPath}`);

  for (const file of files) {
    if (!file.endsWith(".png")) continue;

    const inputPath = path.join(dirPath, file);
    const baseName = path.basename(file, ".png");
    
    // Determine target output webp filename
    const targetBaseName = filenameMap[file] || filenameMap[baseName] || baseName;
    const outputPath = path.join(dirPath, `${targetBaseName}.webp`);

    console.log(`Optimizing: ${file} -> ${targetBaseName}.webp`);

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // Resize maintaining aspect ratio inside 640x440 box, with transparent padding/centering
      await image
        .resize({
          width: TARGET_WIDTH,
          height: TARGET_HEIGHT,
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
      console.log(`  ✓ Created ${targetBaseName}.webp (${(stats.size / 1024).toFixed(1)} KB, Original: ${(fs.statSync(inputPath).size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ Error processing ${file}:`, err);
    }
  }
}

async function run() {
  // Map specific uuid file to Tipper-Trailer
  const carsMap = {
    "cb43d42e-fe5c-419d-8c27-e08b3d425abd.png": "Tipper-Trailer",
  };

  await processDirectory(CARS_DIR, carsMap);
  await processDirectory(PROPS_DIR);

  // If Tipper-Trailer.png doesn't exist, create it as a copy of the uuid file for completeness
  const uuidPng = path.join(CARS_DIR, "cb43d42e-fe5c-419d-8c27-e08b3d425abd.png");
  const tipperPng = path.join(CARS_DIR, "Tipper-Trailer.png");
  if (fs.existsSync(uuidPng) && !fs.existsSync(tipperPng)) {
    fs.copyFileSync(uuidPng, tipperPng);
    console.log("  ✓ Created Tipper-Trailer.png fallback copy");
  }

  console.log("\nAll onboarding assets successfully converted to Retina-ready WebP!");
}

run().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
