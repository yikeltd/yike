/**
 * Local page hero backgrounds — readable under navy gradient overlays.
 * Run: node scripts/generate-hero-images.mjs
 */
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/images/heroes");
const LOGO = join(__dirname, "../public/images/logo.webp");

async function hero(name, accent) {
  const w = 1600;
  const h = 900;
  const svg = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#031B4E"/>
        <stop offset="55%" stop-color="#052560"/>
        <stop offset="100%" stop-color="#021433"/>
      </linearGradient>
      <radialGradient id="a" cx="75%" cy="30%" r="45%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" fill="url(#a)"/>
    <circle cx="200" cy="700" r="280" fill="#E4B547" fill-opacity="0.06"/>
    <circle cx="1400" cy="200" r="200" fill="#E4B547" fill-opacity="0.08"/>
  </svg>`);

  let pipeline = sharp(svg);
  try {
    const logo = await sharp(LOGO).resize(280, 280).png().toBuffer();
    pipeline = pipeline.composite([
      { input: logo, left: Math.round(w * 0.62), top: Math.round(h * 0.22), blend: "over" },
    ]);
  } catch {
    /* logo optional */
  }

  await pipeline.webp({ quality: 82 }).toFile(join(OUT, name));
  console.log(`  heroes/${name}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await hero("contact-hero.webp", "#E4B547");
  await hero("safety-hero.webp", "#f59e0b");
  await hero("about-hero.webp", "#E4B547");
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
