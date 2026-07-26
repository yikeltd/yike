# Hero Integration Report

**Status:** Ready for review · **Do not commit until approved**  
**Asset:** `/images/hero.webp` (from master `/images/hero.png`)  
**Component:** `src/components/home/home-desktop-hero.tsx`

---

## Approach

Treat the hero as a **panoramic UI background**. The interface is designed around the image’s natural frame — the image is not forced into a taller marketing banner.

| Rule | Implementation |
|------|----------------|
| No stretch | Panel `aspect-ratio: 2171 / 724` matches master |
| No distort | `object-contain object-center` inside matching frame |
| No crop of subjects | Natural aspect lock — full panorama visible |
| Left copy zone | Soft warm left gradient only |
| Search as primary CTA | Immediately under copy, inside the frame |
| Inventory-first | Compact spacing; trust strip removed from hero |

---

## Content hierarchy (desktop)

1. Eyebrow — Nigeria’s Trusted Marketplace  
2. Headline — Find your next property or vehicle.  
3. Supporting — Verified listings from trusted sellers across Nigeria.  
4. Properties / Vehicles selector (when vehicles launch-visible)  
5. Search module (primary action)

---

## Layout notes

- Section padding reduced (`pt-3 pb-3`).
- Search shells tightened (`p-3`, smaller chip gaps) for inventory visibility.
- Mobile homepage unchanged (`lg:block` only).

Preview: http://127.0.0.1:3000/ (desktop ≥1024px)
