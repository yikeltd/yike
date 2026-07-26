# Yike Enterprise Media Protection Architecture

**Status:** Production feature (Phase 1)  
**Scope:** Listing photo uploads via `POST /api/media/upload`  
**Date:** 2026-07-26

---

## 1. Goals

Protect every newly uploaded marketplace image against unauthorized reuse (WhatsApp / Facebook Marketplace / Telegram / TikTok / competitor sites) while preserving a premium look.

Protection is **attribution + deterrence + fingerprint foundation**, not DRM. Determined attackers can still crop or edit; Yike raises the cost of theft and preserves seller + brand credit in screenshots.

---

## 2. Architecture overview

```
Client FormData (unchanged API)
        │
        ▼
POST /api/media/upload
        │
        ├─ Auth + lister role
        ├─ Size / magic-byte validation
        ├─ Ownership (UUID listing or draft/{userId})
        │
        ▼
Media Protection Pipeline (server-only, Sharp)
        │
        ├─ Rotate / strip unsafe EXIF
        ├─ SHA256 + aHash + dHash + pHash (pre-watermark)
        ├─ Dynamic attribution label
        ├─ Adaptive corner watermark (12–18% opacity)
        ├─ Diagonal micro “YIKE” pattern (2–4%)
        ├─ Resize → thumb / medium / large (protected)
        ├─ Embed supplemental WebP metadata
        │
        ├─ Private archive: listing-media-archive (original)
        ├─ Public: property-media (*-thumb/md/lg.webp)
        └─ Persist media_assets row (source of truth)
        │
        ▼
Response (same shape as today + optional mediaAssetId)
```

Videos are **out of scope** for Phase 1 (unchanged path).

Profile avatars/covers are **out of scope** for Phase 1 (listing theft is the primary fraud vector).

---

## 3. Processing pipeline

| Step | Responsibility |
|------|----------------|
| 1. Validate | MIME sniff, size ≤ 15MB, ownership |
| 2. Image UUID | `crypto.randomUUID()` per asset |
| 3. Decode | Sharp `rotate()`, failOn none |
| 4. Fingerprint | SHA256 of raw upload bytes + perceptual hashes of clean raster |
| 5. Attribution | Company → full name → “Verified Seller” + ` • Yike.ng` |
| 6. Protect | Micro pattern + corner watermark (adaptive params from image UUID) |
| 7. Variants | Large / medium / thumbnail WebP |
| 8. Archive | Original bytes → private bucket (never public URL) |
| 9. Publish | Protected variants → public `property-media` |
| 10. Persist | `media_assets` row |

**Kill switch:** `ENABLE_MEDIA_PROTECTION=false` falls back to legacy compress-only path (rollback).

---

## 4. Dynamic watermark

Priority:

1. `profiles.company_name` (trimmed, non-empty)  
2. `profiles.full_name`  
3. `Verified Seller`

Label format: `{Attribution} • Yike.ng`

Visible layer: bottom-right, small typography, soft contrast (white or brand gold `#E4B547` chosen from local luminance under the watermark region).

Micro layer: diagonal repeating `YIKE` at 2–4% opacity, wide spacing.

---

## 5. Database

Table `public.media_assets` stores fingerprints, paths, watermark/pipeline versions, seller/company labels, listing linkage.

RLS: owners read own rows; staff read all; writes via service role only.

See migration `20260726102749_media_protection_assets_v1.sql`.

---

## 6. Storage strategy

| Asset | Bucket | Public? |
|-------|--------|---------|
| Original archive | `listing-media-archive` | **No** — staff / service_role only |
| Large / medium / thumb | `property-media` | Yes (protected only) |

Path conventions:

- Public: `properties/{listingOrDraftKey}/{index}-{thumb\|md\|lg}.webp` (unchanged)  
- Archive: `originals/{ownerId}/{imageUuid}.bin` (content-type preserved)

Legacy images without `media_assets` rows continue to work; only new uploads are protected.

---

## 7. Fingerprinting & future AI

Stored: `sha256`, `ahash`, `dhash`, `phash`.

Utilities in `src/lib/media/protection/compare.ts` expose Hamming distance / similarity — **no auto-block**.

Future (no redesign required):

- Near-duplicate listing detection  
- Cross-listing stolen photo alerts  
- Reverse-image style search within Yike corpus  
- Context-aware placement (see `INTELLIGENT_WATERMARK_PLACEMENT.md`)

---

## 8. Performance

- Single Sharp decode; clones for hash + resize  
- Concurrent WebP encodes for three sizes  
- Watermark SVG composited once per size (cheap vs encode)  
- Target: ≤ ~300–800ms extra on typical phone photos (varies by CPU)

If protection fails when enabled, upload returns 400/500 (no silent unprotected public publish).

---

## 9. Security

- Server-side only; clients never watermark  
- Magic-byte + allowlist MIME  
- Re-encode to WebP (strips executable payloads / most EXIF)  
- Ownership checks preserved  
- Private originals  
- No path traversal: UUID + owned listing keys only  
- Configurable opacity / density via env (no hard dependency on secrets)

---

## 10. Configuration (env)

| Variable | Default | Purpose |
|----------|---------|---------|
| `ENABLE_MEDIA_PROTECTION` | `true` | Master switch |
| `MEDIA_WM_CORNER_OPACITY_MIN` | `0.12` | Corner opacity floor |
| `MEDIA_WM_CORNER_OPACITY_MAX` | `0.18` | Corner opacity ceil |
| `MEDIA_WM_PATTERN_OPACITY_MIN` | `0.02` | Micro pattern floor |
| `MEDIA_WM_PATTERN_OPACITY_MAX` | `0.03` | Micro pattern ceil |
| `MEDIA_WM_PATTERN_GAP` | `200` | Pattern spacing (px at large size) |
| `MEDIA_PROTECTION_PIPELINE_VERSION` | `1.0.0` | Persisted version tag |
| `MEDIA_WATERMARK_VERSION` | `1.0.0` | Persisted watermark tag |

---

## 11. Admin tools

- `GET /api/admin/media/assets` — list / filter  
- `GET /api/admin/media/assets/[id]` — detail + signed original URL  
- Lex Tech → Uploads panel shows recent protected assets  

---

## 12. Rollback

1. Set `ENABLE_MEDIA_PROTECTION=false` in Coolify → redeploy  
2. Uploads revert to legacy compress path  
3. Existing protected URLs remain valid  
4. Table/bucket can stay (no destructive rollback required)

---

## 13. Backward compatibility

- Upload API request/response shape unchanged (additive fields only)  
- Existing listing `media_urls` keep working  
- Future optional backfill job can reprocess legacy media offline  

---

## 14. Implementation map

| Module | Role |
|--------|------|
| `src/lib/media/protection/config.ts` | Env-backed settings |
| `attribution.ts` | Dynamic label |
| `fingerprint.ts` | Hashes |
| `watermark.ts` | SVG overlays + adaptive params |
| `pipeline.ts` | Orchestration |
| `compare.ts` | Hamming / similarity |
| `persist.ts` | DB insert |
| `docs/media/*` | Architecture + future placement |
