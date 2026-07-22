# Property Marketplace Validation Report

**Date:** 2026-07-22  
**Scope:** Property vertical only  
**Out of scope:** Vehicle Marketplace · Passport implementation  
**Method:** Code-path review + typecheck + Supabase identity verify (no live browser UAT in this pass)

---

## Journey matrix

| Step | Status | Evidence (high level) | Notes |
|------|--------|------------------------|-------|
| Listing creation | Ready* | `agent/listings/new` · `listing-form` · `api/agent/listings/create` | Submit → `pending`. Drafts are localStorage only (*Partial draft). |
| Listing editing | Ready* | `agent/listings/[id]/edit` | Saves re-queue as `pending` and refresh `expires_at` (*ops side effect). |
| Publishing / lifecycle | Ready | Statuses in `database.ts` · admin moderate API · DB self-approval guard | Live ≡ `approved` + not expired. |
| Search | Ready | `(public)/search` · `properties.ts` · smart-search / fallback | Approved + active only. |
| Filters | Ready | `search-filters` · hubs · verified / price / beds | |
| Saved listings | Ready | Auth `favorites` · guest local + sync on login | |
| Seller profile | Ready | `/agents/[slug]` · trust card · listings feed | |
| Agency profile | Partial | Same slug + agency/developer sections · `/agent/company` | No dedicated agency URL; thin brand section. |
| Property detail | Ready | `/properties/[slug]` · gallery · contact · report · SEO | |
| Media uploads | Ready* | `lib/media` · upload API · photo manager | Images WebP pipeline Ready. Video validate/store; H.264 ≤8MB deferred. |
| Moderation (consumer) | Ready | Report form → `api/reports/listing` | |
| Moderation (admin) | Ready | `/lex/auth/listings` · review · moderate API + PIN | Support moderation path inconsistent (see Admin report). |
| Contact flow | Ready | Contact buttons · lead track/capture · guest-allowed | |
| WhatsApp | Ready | Lead URLs · funnel analytics · seller number verify | Direct-to-agent gated by feature flags. |

**Vehicles:** No consumer routes. Registry `vehicle_marketplace` exists but is **not yet imported** elsewhere — gated by absence today; must wire before any vehicle UI lands.

---

## Defects

### P0 (launch blockers)

None identified that fully break the core property discovery → WhatsApp loop in code review.

### P1 (should track before / at launch)

1. **Edit unpublishes** — every agent save forces `pending` + new expiry; live inventory drops until re-approval.
2. **Launch-mode unwired** — `isLaunchFeatureVisible` unused; vehicle safety depends on no routes existing.
3. **Video optimization deferred** — raw video storage; bandwidth risk on Nigerian mobile.
4. **Reports resolve path** — client-side update without audit/PIN (admin ops integrity).

### P2 (post-launch polish)

1. Drafts are device-local only (no server draft status).
2. Agency storefront thin / no dedicated agency route.
3. Overlapping Lex queues (auth review vs support moderation).
4. Marketplace health pages partly view-only; ops count vs page filter mismatch.

---

## Validation conclusion

Property Marketplace **user journey is launch-capable** for the approved vertical scope, with known limitations documented below. Not a certification of live production UAT — follow `docs/launch/PROPERTY_MARKETPLACE_LAUNCH_CHECKLIST.md` on Coolify after deploy.
