# Advertisement Manager Report

**Status:** Ready for founder review · **No commit** · **Migration not applied**

## Approach

Extended existing `advertisements` table + `/lex/auth/advertising` board — did not invent a parallel ads system. Reused upload route `/api/admin/advertisements/upload` (media pipeline).

## Homepage placements

| Placement | Position |
|-----------|----------|
| `homepage_slot_1` | After Featured |
| `homepage_slot_2` | After Recently Added |
| `homepage_slot_3` | After Near You / Low Mileage |
| `homepage_slot_4` | After Luxury Collection |
| `homepage_slot_5` | After Recommended |

Legacy `homepage_top` / `homepage_middle` / `search_results` remain valid.

## Active rules

An ad renders only when:

1. `status = active` (Enabled)
2. `starts_at` null or ≤ now
3. `expires_at` null or > now
4. `image_url` present

Otherwise the slot component returns `null` — layout collapses.

## Admin fields (`/lex/auth/advertising`)

- Campaign name
- Placement (slots 1–5 primary)
- Banner image (pipeline upload)
- Click URL (internal `/path` or `https://…`)
- Start date / End date
- Enabled checkbox → publish live (pauses sibling active ad on same placement)

## APIs

- `POST /api/admin/advertisements` — admin-managed homepage campaigns (`adminManaged`, dates, enabled)
- `POST /api/admin/advertisements/:id` — `update_schedule` (enable/disable + dates)
- Existing impression/click tracking unchanged

## Migration (founder must apply)

File: `supabase/migrations/20260723170007_homepage_ad_slots_v1.sql`

Extends `advertisements_placement_check` with `homepage_slot_1`…`homepage_slot_5`.

**Do not `db push` from this task.** Apply via Supabase SQL Editor on production (`hlpojfurfldvcxfxhveg`) after review.

Until applied, creating slot 1–5 campaigns will fail the DB check constraint.
