# Homepage Visual Hierarchy Report

**Status:** Ready for review · **Do not commit until approved**

---

## Intended eye flow

```
Logo / navigation
        ↓
Panoramic hero (calm left / subjects right)
        ↓
Headline + short proof line
        ↓
Properties | Vehicles (optional)
        ↓
Search (primary CTA)
        ↓
First marketplace listing row
```

---

## Inventory-first goal

| Goal | How |
|------|-----|
| Not a tall landing page | Hero height locked to panorama (~427px at 1280px), not a 600px+ marketing slab |
| Search above the fold | Search sits inside the panoramic frame under copy |
| Listings soon | Reduced section padding; compact search shell; no hero trust strip |
| Image supports UI | Soft left wash only; right subjects (home / vehicles / skyline) stay clear |

---

## What was removed / reduced

- Floating trust card (earlier pass)
- Statistic pills (earlier pass)
- Dual competing CTAs (earlier pass)
- Hero trust strip (this pass — frees vertical space)
- Heavy navy cinematic overlays → single soft warm left gradient
- Oversized padding on desktop search shell

---

## Validation checklist

| Check | Result |
|-------|--------|
| WebP delivery | Yes (`/images/hero.webp`, 200) |
| Exact dimensions preserved | Yes 2171×724 |
| No stretch / no crop | Yes (aspect-locked + contain) |
| Fast load vs PNG | Yes (~406 KB vs ~2.4 MB) |
| Cache-Control immutable | Yes (1y on `/images/*`) |
| Homepage references hero.webp | Yes |
| Dev server kept open | Yes (port 3000) |

---

## Related reports

1. `HERO_INTEGRATION_REPORT.md`  
2. `HERO_IMAGE_OPTIMISATION_REPORT.md`  
3. `HERO_RESPONSIVE_VALIDATION_REPORT.md`  
4. This file — visual hierarchy  

**Not committed.**
