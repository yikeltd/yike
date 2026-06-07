# Yike — Google Play Store screenshot assets

All captures use **real app UI** at mobile-first viewports (below Tailwind `lg` / 1024px). No redesign, no device frames, no browser chrome.

## Phone

| Set | Path | Size |
|-----|------|------|
| Standard | `public/store/play/` | 1080×2400 |
| HD | `public/store/play-hd/` | 1440×3200 |

```bash
npm run store:capture
SCREENSHOT_OUT=public/store/play-hd npm run store:capture:1440
```

## 7-inch tablet

| Path | Size |
|------|------|
| `public/store/tablet-7/` | 1200×1920 |

```bash
npm run store:capture:tablet-7
```

| File | Caption |
|------|---------|
| `01-home-hero-featured.png` | Discover verified homes |
| `02-swipe-experience.png` | Swipe through beautiful properties |
| `03-search-results.png` | Search smarter across Nigeria |
| `04-property-detail.png` | Full listing details you can trust |
| `05-saved-listings.png` | Save properties you love |

## 10-inch tablet

| Path | Size |
|------|------|
| `public/store/tablet-10/` | 1600×2560 |

```bash
npm run store:capture:tablet-10
```

| File | Caption |
|------|---------|
| `01-homepage.png` | Discover verified homes |
| `02-swipe-discovery.png` | Swipe through beautiful properties |
| `03-property-details.png` | Premium listing presentation |
| `04-search-filters.png` | Search smarter across Nigeria |
| `05-whatsapp-inquiry.png` | Chat instantly on WhatsApp |
| `06-saved-collection.png` | Save properties you love |

## All tablet sets

```bash
npm run store:capture:tablet
```

## Preview in browser (dev server)

```
http://localhost:3000/store/play/01-home-feed.png
http://localhost:3000/store/tablet-7/01-home-hero-featured.png
http://localhost:3000/store/tablet-10/01-homepage.png
```

## Options

- `CAPTION_FRAME=1` — burn minimal caption overlay into PNGs
- `SCREENSHOT_LISTING=/properties/your-slug` — listing detail URL (default: Ogbor Hill, Aba on yike.ng)
- `SCREENSHOT_BASE=http://localhost:3000` — app origin (default)

Requires `npm run dev` and Playwright Chromium (`npx playwright install chromium`).
