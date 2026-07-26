# Responsive Layout Report — Desktop Hero

**Status:** Ready for review · **Do not commit until approved**  
**Component:** `src/components/home/home-desktop-hero.tsx`  
**Asset:** `/images/hero.webp`

---

## Layout goals

1. Panoramic background (not a decorative banner).
2. Left negative space for headline + search.
3. Home, SUV, truck, and skyline remain visible on the right/center.
4. Hero occupies roughly the **upper 25–35%** of the desktop homepage so the first listing rail appears with minimal scroll.
5. Search remains the primary CTA.

---

## Positioning

| Property | Choice | Why |
|----------|--------|-----|
| `object-fit` | `cover` | Fill panel without stretching |
| `object-position` | `left` | Anchors left negative space for copy; subjects stay on the right when height differs from source aspect |
| Panel width | `max-w-7xl` | Matches marketplace content column |
| Min height | `20rem` / `xl:22rem` | Content-driven height (search + toggle); image covers as panoramic wash |

Source aspect (~4.3:1) is wider than the content panel; `object-left` keeps the designed left gutter for text.

---

## Overlay

Replaced dark navy cinematic wash with a **soft warm** readability gradient:

- Horizontal: `from-[#1a1208]/72 via-[#2a1c0e]/28 → transparent`
- Light bottom/top fade for edge polish

Overlay preserves golden-hour colour; only the left copy zone is darkened enough for white type.

---

## Breakpoint balance

| Viewport | Expected behaviour |
|----------|-------------------|
| 1440px | Panel ~1280px wide; left copy readable; house/SUV/truck visible right |
| 1600–1920px | Same column + more page margin; composition unchanged |
| 2560px | No stretch; `sizes` caps Next request ~1280px for the panel |

Next `sizes`: `(min-width: 1280px) 1280px, (min-width: 1024px) 100vw`

Responsive WebP masters exist under `/images/hero/hero-{1280,1440,1920,2560,2880}.webp` for future `srcset` if needed.

---

## Hierarchy (unchanged simplification)

Eyebrow → Headline → Copy → Toggle → **Search** → Trust strip

Mobile homepage remains inventory-first (`lg:block` hero only).
