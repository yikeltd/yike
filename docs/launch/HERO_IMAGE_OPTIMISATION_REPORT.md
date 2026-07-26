# Image Optimisation Report — Production Desktop Hero

**Status:** Ready for review · **Do not commit until approved**  
**Script:** `scripts/optimize-production-hero.mjs`

---

## Source (master — retained)

| Property | Value |
|----------|-------|
| Path | `public/images/hero.png` |
| Dimensions | **2171 × 724** |
| Format | PNG |
| Size | ~2.4 MB |

---

## Production output

| Property | Value |
|----------|-------|
| Path | `public/images/hero.webp` |
| Dimensions | **2171 × 724** (exact match verified) |
| Resize | **None** |
| Crop | **None** |
| Stretch | **None** |
| Quality | **92** (visually lossless target) |
| Metadata | Stripped |
| Size | **~406 KB** |

**Reduction:** ~2.4 MB → ~406 KB (~6× smaller) without changing pixels.

---

## Process

```bash
node scripts/optimize-production-hero.mjs
```

- `sharp` converts PNG → WebP only  
- No `.resize()`  
- Dimension assert fails the build if width/height drift  
- Manifest: `public/images/hero/hero-manifest.json`

Previously generated resized `hero-{1280…2880}.webp` variants were removed to honour the no-resize requirement for this production pass.
