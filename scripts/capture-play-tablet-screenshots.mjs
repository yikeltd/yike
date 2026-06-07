/**
 * Google Play tablet screenshots — mobile-first viewport, scaled export.
 *
 * Usage:
 *   npm run dev
 *   npm run store:capture:tablet-7
 *   npm run store:capture:tablet-10
 *   npm run store:capture:tablet      # both sets
 *
 * Env:
 *   TABLET_SIZE=7|10|both (default: both when run directly)
 *   SCREENSHOT_BASE, SCREENSHOT_LISTING, CAPTION_FRAME=1
 */
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  PROD,
  listingPath,
  GUEST_FAVORITES,
  polishSwipeForCapture,
  waitForImages,
  runPlayCapture,
} from "./capture-play-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = process.env.SCREENSHOT_BASE?.trim() || "http://localhost:3000";

const TABLET_UA_7 =
  "Mozilla/5.0 (Linux; Android 14; SM-T220) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TABLET_UA_10 =
  "Mozilla/5.0 (Linux; Android 14; SM-X900) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** Shared prep helpers */
async function homeHeroFeatured(page, scrollY = 320) {
  await waitForImages(page, { minWidth: 280 });
  await page.waitForTimeout(800);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), scrollY);
  await page.waitForTimeout(500);
}

async function searchResults(page) {
  await waitForImages(page, { minWidth: 280 });
  await page.waitForTimeout(1200);
}

async function searchFiltersOpen(page) {
  await page.waitForTimeout(1200);
  const refine = page.getByRole("button", { name: /refine filters/i });
  if (await refine.isVisible().catch(() => false)) {
    await refine.click();
    await page.waitForTimeout(500);
  }
  await waitForImages(page, { minWidth: 280 });
}

async function propertyDetail(page) {
  await waitForImages(page, { minWidth: 480, timeout: 45000 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(600);
}

async function savedCollection(page) {
  await waitForImages(page, { minWidth: 280 });
  await page.waitForTimeout(1200);
}

async function whatsappInquiry(page) {
  await waitForImages(page, { minWidth: 280 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
}

const SHOTS_7 = [
  {
    file: "01-home-hero-featured.png",
    path: "/",
    caption: "Discover verified homes",
    prepare: (page) => homeHeroFeatured(page, 300),
  },
  {
    file: "02-swipe-experience.png",
    path: "/browse",
    caption: "Swipe through beautiful properties",
    prepare: polishSwipeForCapture,
  },
  {
    file: "03-search-results.png",
    path: "/search?city=Aba",
    caption: "Search smarter across Nigeria",
    prepare: searchResults,
  },
  {
    file: "04-property-detail.png",
    base: PROD,
    path: listingPath(),
    caption: "Full listing details you can trust",
    prepare: propertyDetail,
  },
  {
    file: "05-saved-listings.png",
    path: "/saved",
    caption: "Save properties you love",
    setupStorage: GUEST_FAVORITES,
    prepare: savedCollection,
  },
];

const SHOTS_10 = [
  {
    file: "01-homepage.png",
    path: "/",
    caption: "Discover verified homes",
    prepare: (page) => homeHeroFeatured(page, 240),
  },
  {
    file: "02-swipe-discovery.png",
    path: "/browse",
    caption: "Swipe through beautiful properties",
    prepare: polishSwipeForCapture,
  },
  {
    file: "03-property-details.png",
    base: PROD,
    path: listingPath(),
    caption: "Premium listing presentation",
    prepare: async (page) => {
      await propertyDetail(page);
      await page.evaluate(() => window.scrollTo({ top: 420, behavior: "instant" }));
      await page.waitForTimeout(400);
    },
  },
  {
    file: "04-search-filters.png",
    path: "/search?city=Enugu",
    caption: "Search smarter across Nigeria",
    prepare: searchFiltersOpen,
  },
  {
    file: "05-whatsapp-inquiry.png",
    path: "/saved",
    caption: "Chat instantly on WhatsApp",
    setupStorage: GUEST_FAVORITES,
    prepare: whatsappInquiry,
  },
  {
    file: "06-saved-collection.png",
    path: "/saved",
    caption: "Save properties you love",
    setupStorage: GUEST_FAVORITES,
    prepare: async (page) => {
      await savedCollection(page);
      await page.evaluate(() => window.scrollTo({ top: 480, behavior: "instant" }));
      await page.waitForTimeout(400);
    },
  },
];

const PRESETS = {
  7: {
    outDir: join(ROOT, "public/store/tablet-7"),
    outW: 1200,
    outH: 1920,
    viewW: 600,
    viewH: 960,
    scale: 2,
    userAgent: TABLET_UA_7,
    readmeTitle: "Yike — Google Play 7-inch tablet screenshots",
    shots: SHOTS_7,
  },
  10: {
    outDir: join(ROOT, "public/store/tablet-10"),
    outW: 1600,
    outH: 2560,
    viewW: 800,
    viewH: 1280,
    scale: 2,
    userAgent: TABLET_UA_10,
    readmeTitle: "Yike — Google Play 10-inch tablet screenshots",
    shots: SHOTS_10,
  },
};

async function main() {
  const size = process.env.TABLET_SIZE?.trim() || "both";
  const run = size === "both" ? ["7", "10"] : [size];

  for (const key of run) {
    const preset = PRESETS[key];
    if (!preset) {
      console.error(`Unknown TABLET_SIZE=${key} (use 7, 10, or both)`);
      process.exit(1);
    }
    await runPlayCapture({ ...preset, base: BASE });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
