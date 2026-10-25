# Listing photo lifecycle (device-local drafts + Supabase storage)

## Upload path

1. Seller selects files in `ListingPhotoManager`.
2. Client uploads to Supabase storage; items stay `upload_status: "uploading"` until complete.
3. Only **ready** URLs (`upload_status` not `uploading` or `error`) are included in wizard progress, autosave drafts, and publish payloads (`readyListingPhotoUrls` / `readyMediaUrls`).

## Publish failure

- Failed or in-progress uploads never count toward photo minimums.
- If create API rejects the request, storage objects already uploaded remain in the bucket; the listing row was not created (or not updated). No automatic deletion runs from the wizard.

## Successful publish

- Media URLs are persisted on the `properties` row (`media_urls` / `media_items`).
- **Do not delete** storage objects referenced by an approved or pending listing row.

## Draft abandonment

- Autosave stores **URLs only** in `localStorage` (`yike_engine_listing_draft_v2:*`), not file blobs.
- Orphan objects may exist when a seller uploads photos then abandons a draft without publishing.

## Safe cleanup (not implemented in-app)

Reliable orphan cleanup requires verified ownership and reference checks:

1. Scheduled job (e.g. daily) with service role.
2. For each candidate object: confirm `agent_id` / path prefix matches uploader and **no** `properties.media_urls` (or `media_items`) reference the public URL.
3. Exclude objects newer than a grace period (e.g. 7 days) to avoid race with in-flight uploads.
4. Log deletions to admin audit.

**Do not** run ad-hoc deletion scripts against production buckets from dev or tests.

## Multi-tab / retry

- Publish uses `idempotencyKey` + deterministic row id where supported to reduce duplicate listings on retry.
- Duplicate storage uploads on retry are acceptable; cleanup job above handles unreferenced duplicates later.
