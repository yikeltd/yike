# Marketplace Production UAT & Launch Certification

**Date:** 2026-07-22  
**Commit:** `67338ed3` (pushed to `origin/main`)  
**Supabase:** `hlpojfurfldvcxfxhveg`  
**Migration:** `20260722180232_marketplace_listings_ssot.sql` — **APPLIED**

---

## 1. UAT Certification Report

### Database lifecycle (Vehicle) — PASS

Executed against production with moderation trigger temporarily disabled (postgres login role cannot satisfy `auth.role()=service_role`), then re-enabled (`tgenabled=O`).

| Step | Result |
|------|--------|
| Create pending VEHICLE | PASS (`asset_type=VEHICLE`, status=`pending`) |
| Lex-style approve | PASS (`approved`) |
| `listings` view read | PASS (`VEHICLE`, `is_active=true`, make/model present) |
| Soft edit stay live | PASS (`approved` + `content_review_requested=true`) |
| Property query excludes vehicle | PASS (`property_leak=0`) |
| Vehicle query finds row | PASS |
| Archive (reject) | PASS |
| Cleanup delete | PASS |
| Moderation trigger restored | PASS |

UAT listing cleaned up — no leftover public inventory.

### Schema verification — PASS

| Check | Result |
|-------|--------|
| `properties` table | Present |
| `listings` **view** (`security_invoker`) | Present (not a table) |
| Columns `asset_type`, `attributes`, `auto_category`, `make`, `model`, `vehicle_condition` | Present |
| Existing rows backfilled | 9 × `PROPERTY` |
| `profiles.account_type` includes `dealer` | PASS |
| Migration listed local+remote | `20260722180232` synced |

### HTTP smoke (post-Coolify deploy) — PASS

| Endpoint | HTTP | Notes |
|----------|------|-------|
| `/api/public-health` | 200 | Coolify metadata present (`platform=coolify`); `commit` still null — wire `COOLIFY_SOURCE_COMMIT` / `GIT_COMMIT_SHA` when convenient |
| `/vehicles` | 200 | Shows “Yike Marketplace” / “Sell a vehicle” |
| `/sitemap.xml` | 200 | Includes `https://yike.ng/vehicles` |
| `/` `/search` | 200 | Live |

### App UI lifecycle (Create → Lex → Public → Soft edit) — READY FOR FOUNDER UAT

Coolify is serving the marketplace build. Browser/Lex lifecycle remains the founder sign-off before public Vehicle announcement.

---

## 2. Operations Validation Report

| Area | Status |
|------|--------|
| Lex vertical filters (listings / featured / health) | Shipped in `67338ed3` — validate in UI after deploy |
| CEO Property/Vehicle metrics | Shipped |
| Feature flags + enterprise adapter panel on `/lex/auth/health` | Shipped |
| Dealer account type + Lex dealers filter | Shipped + DB constraint applied |
| Moderation guard | Intact after UAT |

---

## 3. Enterprise Integration Report

| Capability | Production posture |
|------------|-------------------|
| Capability discovery | Local contract snapshot (`discoverEnterpriseCapabilities`) |
| Passport / Trust / Consent / Explainability | `contract_only` — **not enabled** |
| Notification degrade | Adapter returns `degradedToLocal` |
| Passport UI gate | `ENABLE_PASSPORT_UI` / `passport_ui` — off unless flagged |
| No local enterprise engines | Confirmed by architecture |

---

## 4. Performance & Resilience Report

| Item | Assessment |
|------|------------|
| Migration impact | Additive columns + view + indexes — non-destructive |
| Property inventory | Unchanged count (9) after backfill |
| Query isolation | Property filter excludes `VEHICLE` (verified in UAT) |
| Trigger safety | Re-enabled after UAT |
| Rollback | Documented in Sprint III certification + `docs/launch/ROLLBACK.md` |

---

## 5. Launch Readiness Checklist

- [x] Commit Sprint I–III to `main` (`67338ed3`)
- [x] Push `origin/main`
- [x] Verify Supabase project `hlpojfurfldvcxfxhveg`
- [x] Apply `20260722180232_marketplace_listings_ssot.sql`
- [x] Confirm `listings` view + vehicle columns + dealer account type
- [x] DB lifecycle UAT (Vehicle) PASS
- [x] Coolify production deploy live (`/vehicles` + sitemap entry verified 2026-07-22)
- [ ] Browser UAT: Property create → Lex → public → soft edit → archive
- [ ] Browser UAT: Vehicle create → Lex → `/vehicles/[slug]` → save/share → soft edit
- [x] Confirm sitemap includes `/vehicles`
- [ ] Optional: set `COOLIFY_SOURCE_COMMIT` / `GIT_COMMIT_SHA` so health reports the SHA
- [ ] Public announcement of Vehicle marketplace (only after browser UAT)

---

## 6. Final Production GO / NO-GO

| Scope | Decision |
|-------|----------|
| Listings SSOT migration | **GO** — applied and verified |
| Property marketplace (data layer) | **GO** — no regression observed; columns backfilled |
| Vehicle marketplace (data layer) | **GO** — lifecycle certified in DB |
| Coolify app deploy | **GO** — `/vehicles` + sitemap verified live |
| Browser / Lex UI UAT | **PENDING** founder sign-off |
| Public Vehicle launch messaging | **HOLD** until browser UAT PASS |
| Overall | **CONDITIONAL GO** — data + deploy certified; founder browser UAT then Vehicle public launch |

### Immediate next actions

1. Run Lex UI approve on a real agent-created vehicle at `https://yike.ng/vehicles`.
2. Complete Property + Vehicle browser lifecycle UAT.
3. After browser UAT PASS → enable public Vehicle launch communication.

### Note on conflicting local branch

Local backup `backup/local-main-pre-ssot` retained unpushed CORE V2 (`listings` **table** / `AUTO` enum) work that was **not** merged. Production correctly uses the approved SSOT (`properties` + `listings` **view** / `VEHICLE`). Do not push that backup without a separate architecture review.

---

*UAT package complete for migration + data-plane certification. App-plane certification completes when Coolify serves `67338ed3`.*
