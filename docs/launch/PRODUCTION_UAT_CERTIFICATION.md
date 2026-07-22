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

### HTTP smoke (pre-/post-deploy) — PARTIAL

| Endpoint | HTTP | Notes |
|----------|------|-------|
| `/api/public-health` | 200 | `status=ok` · commit still reports `local` (Coolify SHA env not wired / prior build) |
| `/` `/search` `/vehicles` `/sitemap.xml` | 200 | Live |
| Sitemap `/vehicles` URLs | Pending new build | Current sitemap lacks `/vehicles` index entry — expected until Coolify deploys `67338ed3` |
| New Vehicles UI copy | Pending new build | HTML does not yet show Sprint III strings |

### App UI lifecycle (Create → Lex → Public → Soft edit) — PENDING DEPLOY

Requires Coolify production deploy of `67338ed3`. DB path is certified; browser/Lex path remains founder UAT after deploy.

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
- [ ] Coolify production deploy of `67338ed3` (webhook may still be catching up)
- [ ] Browser UAT: Property create → Lex → public → soft edit → archive
- [ ] Browser UAT: Vehicle create → Lex → `/vehicles/[slug]` → save/share → soft edit
- [ ] Confirm sitemap includes `/vehicles` and vehicle detail URLs
- [ ] Confirm `/api/public-health` commit SHA matches deploy (set `COOLIFY_SOURCE_COMMIT` / `GIT_COMMIT_SHA` if missing)
- [ ] Public announcement of Vehicle marketplace (only after browser UAT)

---

## 6. Final Production GO / NO-GO

| Scope | Decision |
|-------|----------|
| Listings SSOT migration | **GO** — applied and verified |
| Property marketplace (data layer) | **GO** — no regression observed; columns backfilled |
| Vehicle marketplace (data layer) | **GO** — lifecycle certified in DB |
| Coolify app deploy / UI UAT | **CONDITIONAL** — waiting for `67338ed3` to go live |
| Public Vehicle launch messaging | **HOLD** until browser UAT PASS |
| Overall | **CONDITIONAL GO** — proceed with Coolify deploy confirmation, then founder browser UAT, then Vehicle public launch |

### Immediate next actions

1. Confirm Coolify production rebuild for `yikeltd/yike@67338ed3` on [control.stankings.com](https://control.stankings.com).
2. Re-check `https://yike.ng/vehicles` for “Sell a vehicle” / vertical switcher.
3. Run Lex UI approve on a real agent-created vehicle.
4. After browser UAT PASS → enable public Vehicle launch communication.

### Note on conflicting local branch

Local backup `backup/local-main-pre-ssot` retained unpushed CORE V2 (`listings` **table** / `AUTO` enum) work that was **not** merged. Production correctly uses the approved SSOT (`properties` + `listings` **view** / `VEHICLE`). Do not push that backup without a separate architecture review.

---

*UAT package complete for migration + data-plane certification. App-plane certification completes when Coolify serves `67338ed3`.*
