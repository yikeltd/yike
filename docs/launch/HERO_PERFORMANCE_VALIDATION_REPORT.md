# Performance Validation Report — Desktop Hero Asset

**Status:** Ready for review · **Do not commit until approved**  
**Local preview:** http://127.0.0.1:3000/ (dev server left running)

---

## Payload

| Asset | HTTP | Bytes | Notes |
|-------|------|-------|-------|
| `/images/hero.webp` | 200 | **205,352** (~200 KB) | Production hero |
| `/images/hero.png` | 200 | 3,119,649 (~3.0 MB) | Source only — not used in UI |

**Transfer reduction vs PNG:** ~93% smaller.

---

## Caching

`next.config.ts` already sets for `/images/:path*`:

```
Cache-Control: public, max-age=31536000, immutable
```

Verified on local response for `hero.webp` (`Content-Type: image/webp`).

---

## Next.js Image

| Setting | Value |
|---------|-------|
| Component | `next/image` |
| `priority` | `true` (LCP candidate on desktop homepage) |
| `fill` | Yes — absolute cover inside hero panel |
| `sizes` | Desktop panel capped at 1280px |
| Lazy load | Off for this hero (correct — above the fold) |

No layout shift: navy/warm placeholder fill behind image; panel has explicit `min-h`.

---

## Checklist

| Check | Result |
|-------|--------|
| `hero.webp` loads | Yes (200) |
| Quality suitable for large displays | Yes (q=88, full 2880 width master) |
| Loading time reduced vs PNG | Yes (~15× smaller) |
| Composition balanced (left copy / right subjects) | Yes (`object-left` + warm overlay) |
| Text readable | Yes (soft warm left wash) |
| Search remains focal CTA | Yes |
| Listings begin quickly below hero | Yes (compact padding; shorter band) |
| Dev server kept open | Yes (port 3000) |

---

## Files touched

- `scripts/optimize-production-hero.mjs` (new)
- `public/images/hero.webp` (+ responsive variants / manifest)
- `src/components/home/home-desktop-hero.tsx`
- Reports in `docs/launch/`

**Not committed** — awaiting founder review.
