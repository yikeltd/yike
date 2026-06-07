import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { chromium } from "playwright";
import sharp from "sharp";

export const NAVY = "#031B4E";
export const GOLD = "#E4B547";
export const PROD = "https://yike.ng";
export const DEFAULT_LISTING_PATH =
  process.env.SCREENSHOT_LISTING?.trim() ||
  "/properties/2-bedroom-flat-for-rent-ogbor-hill-aba";

export function listingPath() {
  return DEFAULT_LISTING_PATH.startsWith("/")
    ? DEFAULT_LISTING_PATH
    : `/${DEFAULT_LISTING_PATH}`;
}

/** Wait until at least one listing image has decoded pixels. */
export async function waitForImages(page, { minWidth = 200, timeout = 30000 } = {}) {
  await page
    .waitForFunction(
      (min) => {
        const imgs = Array.from(document.querySelectorAll("img"));
        return imgs.some(
          (img) => img.complete && img.naturalWidth >= min && img.naturalHeight >= min
        );
      },
      minWidth,
      { timeout }
    )
    .catch(() => {});
  await page.waitForTimeout(600);
}

async function waitForActiveSwipeImage(page) {
  const swipeNext = () =>
    page.evaluate(() => {
      const el = document.querySelector(".swipe-card-active");
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const startX = rect.left + rect.width * 0.82;
      const endX = rect.left + rect.width * 0.12;
      const y = rect.top + rect.height * 0.48;

      const touch = (x) =>
        new Touch({
          identifier: 1,
          target: el,
          clientX: x,
          clientY: y,
          pageX: x,
          pageY: y,
          radiusX: 2.5,
          radiusY: 2.5,
          rotationAngle: 0,
          force: 1,
        });

      el.dispatchEvent(
        new TouchEvent("touchstart", {
          bubbles: true,
          cancelable: true,
          touches: [touch(startX)],
          targetTouches: [touch(startX)],
          changedTouches: [touch(startX)],
        })
      );
      el.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          cancelable: true,
          touches: [],
          targetTouches: [],
          changedTouches: [touch(endX)],
        })
      );
      return true;
    });

  const activeLoaded = () =>
    page.evaluate(() => {
      const card = document.querySelector(".swipe-card-active");
      if (!card) return false;
      for (const img of card.querySelectorAll("img")) {
        const frame = img.parentElement?.parentElement;
        if (!frame || Number(getComputedStyle(frame).opacity) < 0.85) continue;
        if (
          img.naturalWidth >= 400 &&
          img.naturalHeight >= 280 &&
          Number(getComputedStyle(img).opacity) >= 0.9
        ) {
          return true;
        }
      }
      return false;
    });

  await page.waitForTimeout(2500);

  for (let attempt = 0; attempt < 16; attempt++) {
    if (await activeLoaded()) return;
    await swipeNext();
    await page.waitForTimeout(1500);
  }
}

export async function polishSwipeForCapture(page) {
  await page.evaluate(() => {
    document.querySelectorAll("img").forEach((img) => {
      img.loading = "eager";
    });
  });
  await waitForActiveSwipeImage(page);
  await page.addStyleTag({
    content: `.animate-pulse-soft { display: none !important; }`,
  });
  await page.waitForTimeout(400);
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function withCaptionFrame(buffer, caption, w, h) {
  if (process.env.CAPTION_FRAME !== "1") return buffer;

  const frameH = Math.round(h * 0.1);
  const svg = Buffer.from(`<svg width="${w}" height="${frameH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${NAVY}" stop-opacity="0"/>
      <stop offset="35%" stop-color="${NAVY}" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="${NAVY}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="${w / 2}" y="${frameH * 0.62}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="${Math.round(w * 0.028)}" font-weight="700" fill="white">${escapeXml(caption)}</text>
  <rect x="${w / 2 - w * 0.08}" y="${frameH * 0.72}" width="${w * 0.16}" height="3" rx="1.5" fill="${GOLD}"/>
</svg>`);

  return sharp(buffer)
    .composite([{ input: svg, top: h - frameH, left: 0 }])
    .png()
    .toBuffer();
}

export async function hideNoise(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay],
      vercel-live-feedback, #webpack-dev-server-client-overlay { display: none !important; }
      .rounded-full.bg-gold\\/15.text-gold-dark,
      .rounded-full.bg-gold\\/15.text-xs.font-bold.text-gold-dark { display: none !important; }
    `,
  });
}

export const GUEST_FAVORITES = {
  yike_guest_favorites: JSON.stringify(["demo-1", "demo-7", "demo-11", "demo-14"]),
};

/**
 * @param {object} opts
 * @param {import('path').PathLike} opts.outDir
 * @param {string} opts.base
 * @param {number} opts.outW
 * @param {number} opts.outH
 * @param {number} opts.viewW
 * @param {number} opts.viewH
 * @param {number} opts.scale
 * @param {string} opts.userAgent
 * @param {string} opts.readmeTitle
 * @param {Array} opts.shots
 */
export async function runPlayCapture({
  outDir,
  base,
  outW,
  outH,
  viewW,
  viewH,
  scale,
  userAgent,
  readmeTitle,
  shots,
}) {
  console.log(`Capturing from ${base}`);
  console.log(`Viewport ${viewW}×${viewH} @${scale}x → ${outW}×${outH}px\n`);

  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewW, height: viewH },
    deviceScaleFactor: scale,
    isMobile: true,
    hasTouch: true,
    locale: "en-NG",
    colorScheme: "light",
    userAgent,
  });

  const manifest = [];

  for (const shot of shots) {
    const page = await context.newPage();

    if (shot.setupStorage) {
      await page.addInitScript((storage) => {
        for (const [k, v] of Object.entries(storage)) {
          localStorage.setItem(k, v);
        }
      }, shot.setupStorage);
    }

    if (shot.dark) {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.addInitScript(() => {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      });
    }

    const shotBase = (shot.base || base).replace(/\/$/, "");
    const url = `${shotBase}${shot.path}`;
    console.log(`→ ${shot.file}  ${url}`);

    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await hideNoise(page);

    if (shot.prepare) {
      await shot.prepare(page);
    }

    const rawPath = join(outDir, shot.file.replace(".png", ".raw.png"));
    await page.screenshot({
      path: rawPath,
      type: "png",
      fullPage: false,
      animations: "disabled",
    });

    let buffer = await sharp(rawPath)
      .resize(outW, outH, { fit: "cover", position: "top" })
      .png({ compressionLevel: 9 })
      .toBuffer();
    buffer = await withCaptionFrame(buffer, shot.caption, outW, outH);

    const outPath = join(outDir, shot.file);
    await sharp(buffer).png().toFile(outPath);

    const meta = await sharp(outPath).metadata();
    const sizeMb = buffer.length / (1024 * 1024);

    manifest.push({
      file: shot.file,
      caption: shot.caption,
      path: shot.path,
      width: meta.width,
      height: meta.height,
      sizeMb: Number(sizeMb.toFixed(2)),
    });

    console.log(`   ✓ ${meta.width}×${meta.height}  ${sizeMb.toFixed(2)} MB`);
    await page.close();
  }

  await browser.close();

  const readme = `# ${readmeTitle}

Captured at **${outW}×${outH}px** (mobile-first viewport below \`lg\` — base \`${base}\`).

| File | Caption |
|------|---------|
${manifest.map((m) => `| \`${m.file}\` | ${m.caption} |`).join("\n")}

## Specs
- PNG, ${outW}×${outH}px
- CSS viewport ${viewW}×${viewH} @ ${scale}x
- No browser chrome or device frames

Regenerate: see \`package.json\` store capture scripts.
`;

  await writeFile(join(outDir, "README.md"), readme);
  await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\nDone → ${outDir}`);
  return manifest;
}
