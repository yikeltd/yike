# Engineering Report — Enterprise Media Protection Pipeline

**Date:** 2026-07-26  
**Feature:** Yike listing-image trust infrastructure  
**Docs:** [MEDIA_PROTECTION_ARCHITECTURE.md](./MEDIA_PROTECTION_ARCHITECTURE.md) · [INTELLIGENT_WATERMARK_PLACEMENT.md](./INTELLIGENT_WATERMARK_PLACEMENT.md)

---

## Summary

Listing photo uploads now pass through a server-side Media Protection Pipeline when `ENABLE_MEDIA_PROTECTION=true` (default). Public variants carry a dynamic seller/company watermark plus a faint repeating `YIKE` pattern. Fingerprints (SHA256, aHash, dHash, pHash) and protection metadata are stored in `media_assets`. Unprotected originals go to a **private** archive bucket.

Upload API request shape is unchanged; response adds optional fields (`protected`, `mediaAssetId`, `imageUuid`, `watermarkLabel`).

---

## Files added / modified

### Added
- `docs/media/MEDIA_PROTECTION_ARCHITECTURE.md`
- `docs/media/INTELLIGENT_WATERMARK_PLACEMENT.md`
- `docs/media/MEDIA_PROTECTION_ENGINEERING_REPORT.md` (this file)
- `supabase/migrations/20260726102749_media_protection_assets_v1.sql`
- `src/lib/media/protection/*` (config, attribution, fingerprint, watermark, pipeline, persist, compare, index, tests)
- `src/app/api/admin/media/assets/route.ts`
- `src/app/api/admin/media/assets/[id]/route.ts`
- `src/app/api/admin/media/compare/route.ts`
- `src/components/admin/media-protection-assets-panel.tsx`

### Modified
- `src/app/api/media/upload/route.ts` — protection integration + legacy kill-switch path
- `src/app/lex/tech/uploads/page.tsx` — registry panel
- `src/lib/admin/navigation.ts` — nav label
- `src/lib/media/index.ts` — exports
- `.env.example` — protection flags
- `package.json` — `test:media-protection`

---

## Database changes

- Table `public.media_assets` (fingerprints, paths, versions, RLS)
- Bucket `listing-media-archive` (private; staff select/all)

Apply with verified CLI: `npx supabase db push --yes` (project `hlpojfurfldvcxfxhveg`).

**Applied on production:** 2026-07-26 (`20260726102749_media_protection_assets_v1`).

---

## Processing pipeline

1. Validate size + magic MIME + ownership  
2. Generate image UUID  
3. Fingerprint clean source  
4. Strip EXIF → resize thumb/md/lg  
5. Adaptive corner watermark + micro pattern  
6. Publish protected WebPs to `property-media`  
7. Archive original to `listing-media-archive`  
8. Insert `media_assets`  

Dynamic label: `company_name` → `full_name` → `Verified Seller` + ` • Yike.ng`.

---

## Performance impact

- Extra Sharp composites ×3 sizes + fingerprint encodes  
- Expected: hundreds of ms on typical phone photos (CPU-bound)  
- pHash uses fast 32×32 block-average (not full DCT) to keep upload latency acceptable  
- Archive failure is logged but does not fail the public upload once variants succeed  

---

## Security considerations

- Server-side only; clients never watermark  
- Re-encode to WebP; strip unsafe EXIF on public variants  
- Ownership checks retained  
- Originals not publicly URL-addressable  
- Staff-only inspection APIs (`requireTechApi`)  
- Kill switch: `ENABLE_MEDIA_PROTECTION=false`

---

## Migration / compatibility

- Existing listing images continue to work without rows in `media_assets`  
- Only **new** uploads are protected  
- Future optional backfill can reprocess legacy media offline  
- Intelligent placement (Phase 2+) documented; flag default off  

---

## Recommendations before production enablement

1. Apply migration `20260726102749_media_protection_assets_v1` on prod  
2. Confirm Coolify has `ENABLE_MEDIA_PROTECTION=true` (or unset → default true)  
3. Smoke-test one listing photo upload; verify Lex Tech → Uploads & Protection shows a row  
4. Visually QA watermark on dark and bright interiors / exteriors  
5. Ensure `ENABLE_VEHICLE_MARKETPLACE` posture remains intentional (protection works for listing photos regardless)  
6. Do **not** enable auto-blocking on phash yet — use compare utilities only  

---

## Tests

```bash
npm run test:media-protection
```

Covers attribution priority, fingerprints, watermark output, and full `protectListingImage` orchestration.
