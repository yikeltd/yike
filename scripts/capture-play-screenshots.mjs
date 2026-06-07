/**
 * Capture REAL mobile-viewport Play Store phone screenshots from the running Yike app.
 *
 * Usage:
 *   npm run dev
 *   npm run store:capture
 *
 * Env:
 *   SCREENSHOT_BASE, SCREENSHOT_OUT, SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT, CAPTION_FRAME=1
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
const OUT = join(ROOT, process.env.SCREENSHOT_OUT?.trim() || "public/store/play");
const OUT_W = Number(process.env.SCREENSHOT_WIDTH || 1080);
const OUT_H = Number(process.env.SCREENSHOT_HEIGHT || 2400);
const VIEW_W = Math.round(OUT_W / 4);
const VIEW_H = Math.round(OUT_H / 4);
const SCALE = 4;

const SHOTS = [
  {
    file: "01-home-feed.png",
    path: "/",
    caption: "Discover verified homes across Nigeria",
    async prepare(page) {
      await page.waitForTimeout(1200);
      await page.evaluate(() => window.scrollTo({ top: 280, behavior: "instant" }));
      await page.waitForTimeout(600);
    },
  },
  {
    file: "02-swipe-experience.png",
    path: "/browse",
    caption: "Swipe through beautiful properties effortlessly",
    prepare: polishSwipeForCapture,
  },
  {
    file: "03-search-filters.png",
    path: "/search?city=Enugu",
    caption: "Search by city, budget, and property type",
    async prepare(page) {
      await page.waitForTimeout(1500);
      const refine = page.getByRole("button", { name: /refine filters/i });
      if (await refine.isVisible().catch(() => false)) {
        await refine.click();
        await page.waitForTimeout(400);
      }
    },
  },
  {
    file: "04-saved-whatsapp.png",
    path: "/saved",
    caption: "Save favorites and chat instantly",
    setupStorage: GUEST_FAVORITES,
    async prepare(page) {
      await page.waitForTimeout(1500);
    },
  },
  {
    file: "05-listing-detail.png",
    base: PROD,
    path: listingPath(),
    caption: "Full listing details with verified agents",
    async prepare(page) {
      await waitForImages(page, { minWidth: 480, timeout: 45000 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(600);
    },
  },
  {
    file: "06-nearby-homes.png",
    path: "/search?city=Aba",
    caption: "Browse homes in cities across Nigeria",
    async prepare(page) {
      await page.waitForTimeout(1500);
    },
  },
  {
    file: "07-agent-trust.png",
    path: "/why-verified",
    caption: "Verified agents you can trust",
    async prepare(page) {
      await page.waitForTimeout(800);
    },
  },
  {
    file: "08-dark-mode.png",
    path: "/",
    caption: "Premium dark mode for evening browsing",
    dark: true,
    async prepare(page) {
      await page.waitForTimeout(1200);
      await page.evaluate(() => window.scrollTo({ top: 200, behavior: "instant" }));
      await page.waitForTimeout(500);
    },
  },
];

runPlayCapture({
  outDir: OUT,
  base: BASE,
  outW: OUT_W,
  outH: OUT_H,
  viewW: VIEW_W,
  viewH: VIEW_H,
  scale: SCALE,
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  readmeTitle: "Yike — Google Play phone screenshots",
  shots: SHOTS,
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
