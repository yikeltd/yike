# Hero Asset Optimization Report

**Status:** Ready for review · **Do not commit until approved**  
**Source:** `public/images/hero.png` (preserved)  
**Primary output:** `public/images/hero.webp`

---

## Source

| Property | Value |
|----------|-------|
| File | `public/images/hero.png` |
| Dimensions | 2880 × 668 |
| Format | PNG (sRGB, alpha) |
| Size | ~3.0 MB |

Composition: panoramic golden-hour scene — left negative space (sky/street) for copy; right/center subjects (modern home, black SUV, commercial truck, skyline).

---

## Optimization

Script: `scripts/optimize-production-hero.mjs`

| Setting | Value |
|---------|-------|
| Codec | WebP |
| Quality | **88** (target 85–90) |
| Effort | 6 |
| Resize | Width-only, `fit: inside`, no crop |
| Metadata | Stripped (no EXIF/ICC payload retained) |
| Colour | sRGB preserved; no modulate/saturation shifts |

### Outputs

| Asset | Size | Dimensions |
|-------|------|------------|
| `/images/hero.webp` | **200.5 KB** | 2880×668 |
| `/images/hero/hero-1280.webp` | 79.3 KB | 1280×297 |
| `/images/hero/hero-1440.webp` | 92.1 KB | 1440×334 |
| `/images/hero/hero-1920.webp` | 131.2 KB | 1920×445 |
| `/images/hero/hero-2560.webp` | 176.9 KB | 2560×594 |
| `/images/hero/hero-2880.webp` | 200.5 KB | 2880×668 |

**Compression:** ~3.0 MB → ~200 KB (**~15× smaller**) at quality 88.

Original PNG is **not** overwritten.

Manifest: `public/images/hero/hero-manifest.json`

---

## Quality checks

| Risk | Mitigation / result |
|------|---------------------|
| Artifacts / banding | Quality 88 + smart subsample; no aggressive downscale of master |
| Blurry edges | No upscaling; full-res master retained |
| Colour shift | No brightness/saturation modulate (unlike older city-hero script) |
| Haloing | Soft warm CSS overlay only — not baked into the asset |

---

## Regenerate

```bash
node scripts/optimize-production-hero.mjs
```
