# Listing Lifecycle — Owner Experience

**Status:** Implemented (surgical owner-access fix)  
**Date:** 2026-07-26  
**Rule:** Public visibility ≠ owner visibility.

## Problem

Sellers tapping a listing from **My Listings** could hit **404 / unavailable** when the listing was pending, rejected, expired, sold, rented, or archived. That felt like the listing was lost.

## Primary rule

| Viewer | Non-public listing |
|--------|--------------------|
| Public | Hidden / unavailable |
| Owner | Full owner preview + management |
| Admin | Staff preview |

Marketplace discovery and search engines are unchanged. Only owner/admin detail access and seller dashboard UX were improved.

## Routing logic

```
Open /properties/[slug] or /vehicles/[slug]
        │
        ▼
  Fetch listing (RLS: public approved OR owner OR admin)
        │
        ├─ missing → not found / unavailable
        │
        ▼
  isListingPubliclyActive?
        │
        ├─ yes → Public listing detail
        │         (+ owner management banner if viewer is owner)
        │
        └─ no  → canPreviewOwnerListing(viewer)?
                    │
                    ├─ yes → Owner / staff preview (same page, banner)
                    └─ no  → ListingUnavailable (never 404 for owner)
```

Vehicles previously called `notFound()` unless `status === "approved"`. They now mirror property permission resolution.

## Lifecycle diagram

```
Draft (local)
   │ submit
   ▼
Pending / Flagged ──► Rejected ──► Edit / Resubmit → Pending
   │
   ▼ approve
Active (public)
   │
   ├── Mark Sold ──────────────► Sold (archived + availability sold)
   ├── Mark Rented ────────────► Rented
   ├── Expire ─────────────────► Expired (owner still sees)
   └── Archive ────────────────► Archived (hidden)
          │
          └── Available Again / Renew ──► Pending (re-review)
```

## Status → owner banner

| Status | Banner |
|--------|--------|
| Pending | Under review + ETA copy |
| Flagged | Closer look |
| Rejected | Reason (`moderation_note`) + Edit |
| Expired | Renew / Edit / Archive |
| Sold | Sold + Available Again |
| Rented | Rented + Available Again |
| Archived | Restore via Available Again |
| Hidden / Unavailable | Restore messaging |

## Permission matrix

| Action | Public | Owner | Admin |
|--------|--------|-------|-------|
| View active listing | ✓ | ✓ | ✓ |
| View pending / rejected / expired / sold / rented / archived | ✗ | ✓ | ✓ |
| Edit | ✗ | ✓ | ✓ (staff tools) |
| Mark sold / rented | ✗ | ✓ (status-aware) | via admin |
| Available again / renew | ✗ | ✓ | via admin |
| Archive | ✗ | ✓ | ✓ |

## Status transitions (API)

Existing endpoint: `PATCH /api/agent/listings/[id]/lifecycle`

| Action | Result |
|--------|--------|
| `mark_sold` | `status=archived`, `availability_status=sold` |
| `mark_rented` | `status=rented`, `availability_status=rented` |
| `archive` | `status=archived`, `availability_status=hidden` |
| `reactivate` | `status=pending` (needs review) |
| `mark_unavailable` | approved + unavailable |

All actions write audit logs via `writeAuditLog`.

## My Listings filters

Compact chips with counts:

- **All** · **Active** · **Pending** · **Expired** · **Sold** (sold + rented) · **Archived**

Card tap and **Preview** always open the public listing route (owner preview when not live). **Edit** stays separate.

## Files modified

| File | Change |
|------|--------|
| `src/lib/listing-lifecycle.ts` | Owner preview for any owned listing; sold/rented/archived helpers; banner kind |
| `src/components/agent/owner-listing-status-banner.tsx` | **New** — status banner + actions |
| `src/app/(public)/properties/[slug]/page.tsx` | `isListingPubliclyActive` + owner banner |
| `src/app/(public)/vehicles/[slug]/page.tsx` | Owner/admin access (no hard 404 for owners) |
| `src/components/marketplace/vehicle-premium-detail.tsx` | `ownerBanner` slot |
| `src/components/agent/agent-listings-client.tsx` | Count chips + preview links + status actions |
| `docs/listing/LISTING_LIFECYCLE_OWNER_EXPERIENCE.md` | This doc |

## Do not change (honored)

Listing Engine · Search Engine · Financial Capability · Metadata Engine · Capability Runtime · YIP · public marketplace permissions (beyond owner gate on detail).

## Validation checklist

- [ ] Owner opens pending property → preview, not 404
- [ ] Owner opens pending vehicle → preview, not 404
- [ ] Owner opens rejected / expired / sold / rented / archived → preview
- [ ] Public cannot open those URLs when logged out / other user
- [ ] Admin can open non-public listings
- [ ] Mark Sold / Mark Rented hides from marketplace; owner retains history
- [ ] Available Again / Renew returns listing to pending review
- [ ] My Listings chips show correct counts including Pending
- [ ] Card tap opens owner preview for every status
- [ ] `npx tsc --noEmit` clean for touched files
- [ ] No lint regressions on touched files

## Screenshots

Capture after local preview:

1. My Listings — filter chips with counts  
2. Owner preview — pending banner  
3. Owner preview — sold / rented banner with Available Again  
4. Public user hitting unavailable for a sold listing  

Store under `docs/listing/screenshots/` when available.
