# Media Protection — Production Smoke (Founder)

**Status:** ❌ NOT PRODUCTION VERIFIED (`media_assets` count = **0**)  
**Date prepared:** 2026-07-26  
**Feature freeze:** Do not change pipeline code unless smoke fails with a Critical bug.

This is a **real upload** validation. Seed/Unsplash URLs do **not** count.

---

## Preconditions

1. Staff or seller account that can create/edit a property listing on https://yike.ng  
2. Coolify env: `ENABLE_MEDIA_PROTECTION` unset or `true` (default on)  
3. Phone photo of a real room/building (JPEG/HEIC → app accepts JPEG/PNG/WebP)  
4. Lex staff access for `/lex/tech` Uploads & Protection

---

## Steps (≈ 5–10 minutes)

### A. Seller upload

1. Sign in on https://yike.ng  
2. Open **Sell** / post property (existing draft OK)  
3. Upload **one** clear property photo through the normal UI  
4. Wait for upload success (do not refresh mid-upload)  
5. Open the public image URL (listing preview / card)  
6. Confirm a **corner watermark** is visible on the public WebP

### B. Registry

1. Lex → Tech → **Uploads & Protection** (or staff media assets panel)  
2. Confirm a new row appears with:
   - fingerprint fields present (SHA / perceptual hashes as designed)
   - protected / public WebP reference
   - private original archived (not anonymously fetchable)
   - listing / owner metadata linked

### C. Private original

1. Copy any archive/original storage path from the admin row  
2. Open in a private/incognito window **without** staff auth  
3. Expect **denied** / non-public (bucket `listing-media-archive` is private)

### D. Kill-switch awareness (do not flip unless incident)

- Rollback: Coolify `ENABLE_MEDIA_PROTECTION=false` → compress-only legacy path  
- Only use if uploads fail critically for sellers

---

## Pass criteria (all required)

| # | Criterion | ☐ |
|---|-----------|---|
| 1 | Upload succeeds in production UI | ☐ |
| 2 | Public image shows watermark | ☐ |
| 3 | `media_assets` ≥ 1 (SQL or Lex panel) | ☐ |
| 4 | Fingerprint fields populated | ☐ |
| 5 | Protected WebP served publicly | ☐ |
| 6 | Private original not anonymously reachable | ☐ |
| 7 | Admin can see the asset | ☐ |

When all checked, update:

1. This file → **PRODUCTION VERIFIED** + date + initials  
2. [MEDIA_PROTECTION_LAUNCH_VERIFICATION.md](../media/MEDIA_PROTECTION_LAUNCH_VERIFICATION.md)  
3. [LAUNCH_COMMAND_CENTER.md](./LAUNCH_COMMAND_CENTER.md) — close **C12**

---

## Failure triage (freeze-safe)

| Symptom | Action |
|---------|--------|
| Upload 401/403 | Session / ownership — ops, not redesign |
| Upload 413 / MIME | Size/type gate working — use smaller JPEG |
| No watermark | Confirm Coolify flag not `false`; check Coolify logs |
| No `media_assets` row | Coolify logs for media upload route; eng only if Critical defect proven |
| Archive public | **Critical** — stop uploads; verify bucket `public=false` |

---

## Current measurement (2026-07-26)

| Probe | Result |
|-------|--------|
| `GET /api/admin/media/assets` (anon) | **401** Sign in required |
| Anon REST `media_assets` count | **0** |
| Verdict | **Not verified** |
