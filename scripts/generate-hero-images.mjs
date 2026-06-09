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
const HERO_OUT = join(__dirname, "../public/images/hero");
const AGENT_OUT = join(HERO_OUT, "agents");
const LOGO = join(__dirname, "../public/images/logo.webp");
const REF = join(__dirname, "assets/desktop-hero-reference.jpg");

async function hero(name, accent, { withLogo = true } = {}) {
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
  if (withLogo) {
    try {
      const logo = await sharp(LOGO).resize(280, 280).png().toBuffer();
      pipeline = pipeline.composite([
        { input: logo, left: Math.round(w * 0.62), top: Math.round(h * 0.22), blend: "over" },
      ]);
    } catch {
      /* logo optional */
    }
  }

  await pipeline.webp({ quality: 82 }).toFile(join(OUT, name));
  console.log(`  heroes/${name}`);
}

/** City skyline for desktop homepage hero — no logo watermark. */
async function cityHero(outDir, name) {
  const w = 1600;
  const h = 900;
  const svg = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stop-color="#0a2d6e"/>
        <stop offset="45%" stop-color="#031B4E"/>
        <stop offset="100%" stop-color="#021433"/>
      </linearGradient>
      <linearGradient id="glow" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#E4B547" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#E4B547" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#042560" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#031B4E" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#sky)"/>
    <rect x="0" y="0" width="100%" height="100%" fill="url(#glow)"/>
    <ellipse cx="1180" cy="180" r="220" fill="#E4B547" fill-opacity="0.08"/>
    <rect x="0" y="620" width="100%" height="280" fill="url(#water)"/>
    <g fill="#021433" fill-opacity="0.92">
      <rect x="720" y="420" width="88" height="480" rx="4"/>
      <rect x="820" y="360" width="72" height="540" rx="4"/>
      <rect x="910" y="300" width="96" height="600" rx="4"/>
      <rect x="1020" y="340" width="64" height="560" rx="4"/>
      <rect x="1100" y="280" width="110" height="620" rx="4"/>
      <rect x="1230" y="380" width="78" height="520" rx="4"/>
      <rect x="1320" y="320" width="92" height="580" rx="4"/>
      <rect x="1430" y="400" width="70" height="500" rx="4"/>
      <rect x="1520" y="440" width="80" height="460" rx="4"/>
    </g>
    <g fill="#031B4E" fill-opacity="0.88">
      <rect x="640" y="500" width="60" height="400" rx="3"/>
      <rect x="680" y="460" width="52" height="440" rx="3"/>
      <rect x="980" y="480" width="58" height="420" rx="3"/>
      <rect x="1180" y="460" width="66" height="440" rx="3"/>
      <rect x="1380" y="500" width="54" height="400" rx="3"/>
    </g>
    <g fill="#E4B547" fill-opacity="0.55">
      <rect x="744" y="460" width="10" height="14" rx="1"/>
      <rect x="770" y="500" width="10" height="14" rx="1"/>
      <rect x="744" y="540" width="10" height="14" rx="1"/>
      <rect x="938" y="360" width="12" height="16" rx="1"/>
      <rect x="970" y="400" width="12" height="16" rx="1"/>
      <rect x="938" y="440" width="12" height="16" rx="1"/>
      <rect x="1130" y="340" width="12" height="16" rx="1"/>
      <rect x="1168" y="380" width="12" height="16" rx="1"/>
      <rect x="1130" y="420" width="12" height="16" rx="1"/>
      <rect x="1350" y="380" width="12" height="16" rx="1"/>
      <rect x="1388" y="420" width="12" height="16" rx="1"/>
    </g>
  </svg>`);

  await mkdir(outDir, { recursive: true });
  await sharp(svg).webp({ quality: 84 }).toFile(join(outDir, name));
  console.log(`  hero/${name}`);
}

/** Extract photo city + sample agent avatars from the desktop hero reference mockup. */
async function extractDesktopHeroAssets() {
  try {
    await sharp(REF).metadata();
  } catch {
    console.log("  (skip reference extract — no scripts/assets/desktop-hero-reference.jpg)");
    return false;
  }

  await mkdir(AGENT_OUT, { recursive: true });

  await sharp(REF)
    .extract({ left: 420, top: 46, width: 604, height: 292 })
    .resize(1600, 900, { fit: "cover", position: "right" })
    .webp({ quality: 86 })
    .toFile(join(HERO_OUT, "yike-city-hero.webp"));
  console.log("  hero/yike-city-hero.webp (from reference)");

  const avatarCrops = [
    { name: "sample-1.webp", left: 748, top: 224, size: 46 },
    { name: "sample-2.webp", left: 784, top: 224, size: 46 },
    { name: "sample-3.webp", left: 820, top: 224, size: 46 },
    { name: "sample-4.webp", left: 856, top: 224, size: 46 },
  ];

  for (const crop of avatarCrops) {
    await sharp(REF)
      .extract({
        left: crop.left,
        top: crop.top,
        width: crop.size,
        height: crop.size,
      })
      .resize(96, 96, { fit: "cover" })
      .webp({ quality: 88 })
      .toFile(join(AGENT_OUT, crop.name));
    console.log(`  hero/agents/${crop.name}`);
  }

  return true;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await hero("contact-hero.webp", "#E4B547");
  await hero("safety-hero.webp", "#f59e0b");
  await hero("about-hero.webp", "#E4B547");
  await hero("home-hero.webp", "#E4B547", { withLogo: false });
  await mkdir(HERO_OUT, { recursive: true });
  const extracted = await extractDesktopHeroAssets();
  if (!extracted) {
    await cityHero(HERO_OUT, "yike-city-hero.webp");
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
