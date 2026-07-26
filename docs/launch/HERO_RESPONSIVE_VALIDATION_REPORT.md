# Responsive Validation Report — Desktop Hero

**Status:** Ready for review · **Do not commit until approved**

---

## Method

Panel width follows `max-w-7xl` (≤1280px content). Height is derived from locked aspect `2171/724`, so the panorama scales uniformly at every desktop width — never stretched.

Formula: `height ≈ panelWidth × (724 / 2171)`

---

## Breakpoints

| Viewport | Approx. panel width | Approx. panel height | Behaviour |
|----------|---------------------|----------------------|-----------|
| 1440px | ~1280px | ~427px | Full panorama; left copy; search in-frame |
| 1600px | ~1280px | ~427px | Same frame; more page margin |
| 1920px | ~1280px | ~427px | Unchanged composition |
| 2560px | ~1280px | ~427px | No stretch; Next `sizes` caps request ~1280px |

Below `lg` (1024px): desktop hero hidden — mobile inventory-first experience.

---

## Image CSS

| Property | Value |
|----------|-------|
| `object-fit` | `contain` |
| `object-position` | `center` |
| Frame | Matching aspect ratio |

Because frame aspect = image aspect, `contain` and `cover` are equivalent — full image, no letterboxing, no crop.

---

## Positioning

Only the **left readability wash** changes visual weight; the photo itself is not repositioned per breakpoint. If future art direction needs a bias, adjust `object-position` — not scale.
