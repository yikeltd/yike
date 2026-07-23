# Image Optimization Report — Homepage Ads

**Status:** Reuses existing Yike media pipeline

## Upload path

Admin banner upload → `POST /api/admin/advertisements/upload` → `handleAdminImageUpload` with **`preset: "banner"`**, folder `sponsored`.

Pipeline (unchanged):

1. Compress via `compressAdminPresetImage`
2. Store as **WebP** (`storeWebpObject` → `AD_CREATIVES_BUCKET`)
3. Strip metadata as part of compress/store
4. Responsive display via `next/image` `sizes` on `SponsoredAdBanner`

## Creative guidance

Homepage slots: design **1200 × 500** (2.4 : 1). Display capped ~112–128 px tall on homepage for inventory density.

## Lazy loading

- Homepage ad banners use `loading="lazy"` on `next/image`
- First-viewport listing thumbs keep `priority` for LCP (first 2 per rail only)

## No secrets

Upload uses existing admin auth + service role server-side; no new env vars.
