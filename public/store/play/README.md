# Yike — Google Play phone screenshots (1080×2400)

Captured at **1080×2400px** (true mobile viewport portrait — primary base `http://localhost:3000`).

Upload these PNGs to Play Console → Store listing → Phone screenshots.

| # | File | Play Store caption |
|---|------|-------------------|
| 1 | `01-home-feed.png` | Discover verified homes across Nigeria |
| 2 | `02-swipe-experience.png` | Swipe through beautiful properties effortlessly |
| 3 | `03-search-filters.png` | Search by city, budget, and property type |
| 4 | `04-saved-whatsapp.png` | Save favorites and chat instantly |
| 5 | `05-listing-detail.png` | Full listing details with verified agents |
| 6 | `06-nearby-homes.png` | Browse homes in cities across Nigeria |
| 7 | `07-agent-trust.png` | Verified agents you can trust |
| 8 | `08-dark-mode.png` | Premium dark mode for evening browsing |

HD set (1440×3200): see `../play-hd/`

## Specs
- Format: PNG (all under 8 MB)
- Dimensions: 1080×2400px
- Mobile viewport: 270×600 CSS px @ 4x device scale
- No desktop chrome, no browser UI, no device frames

## Regenerate
```bash
npm run dev   # required
npm run store:capture          # 1080×2400 → public/store/play
npm run store:capture:1440     # 1440×3200 → public/store/play (use SCREENSHOT_OUT=public/store/play-hd)
```

Optional: burn caption overlay with `CAPTION_FRAME=1`. Override listing detail URL with `SCREENSHOT_LISTING=/properties/your-slug`.
