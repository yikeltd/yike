# Platform Activation Report

**Living scorecard** for the [Enterprise Activation Program](./ENTERPRISE_ACTIVATION_PROGRAM.md).  
Update after each capability stage change. Do not leave blank/unknown rows.

**Last updated:** 2026-07-26  
**Overall:** NOT LAUNCH-CERTIFIED — program declared; Phase 0 PIN pepper and Group 1 activation pending

---

## P0 blockers

| Item | Status | Notes |
|------|--------|-------|
| `YIKE_PIN_PEPPER` in Coolify | 🔴 Confirm | Required before launch; env-health checks presence |
| Email OTP | 🟡 Audit | Browse-first policy; certify path |
| SMS OTP | 🟡 | Re-enable when provider proven; do not block if email sufficient |
| Featured / Paystack payments | 🔴 | Flagged off — Payment Capability activation |
| Admin auth / PIN | 🟡 | Recent service-role PIN fix; re-FAT |

---

## Capability register

| Capability | Group | Lifecycle | Flag | Health | Notes |
|------------|-------|-----------|------|--------|-------|
| Listing Engine | 🟢 | Production | — | 🟡 | Engine-1 shipped; certify under load |
| YIP Runtime / Plugin Host | 🟢 | Production | — | 🟡 | Phase 1 certification |
| Knowledge Layer | 🟢 | Production | — | 🟡 | Catalogs live |
| Auth (email OTP / session) | 🟢 | Beta→Production | — | 🟡 | Certify |
| Auth SMS | 🟢 | Experimental/Beta | SMS flags | 🟡 | Re-enable when ready |
| Payment | 🟢 | Planned→Beta | `ENABLE_FEATURED_PAYMENTS` / `ENABLE_PAYMENTS` | 🔴 | Provider abstraction required |
| Wallet | 🟢 | Planned | `ENABLE_WALLET` | 🔴 | Recommend enable for launch ledger |
| Search | 🟢 | Beta | — | 🟡 | Complete autocomplete/ranking/saved |
| Trust (engine) | 🟢 | Beta | Trust Economy UI off | 🟡 | Backend scores; UI hidden |
| Media | 🟢 | Production | — | 🟢 | Add duplicate + video prep |
| Settlement (Escrow) | 🟡 | Planned | `ENABLE_ESCROW` | 🔴 | UI hidden |
| Financing | 🟡 | Planned | `ENABLE_FINANCING` | 🔴 | UI hidden |
| Protection | 🟡 | Planned | `ENABLE_PROTECTION` | 🔴 | UI hidden |
| Verification / Passport / Registry | 🟡 | Planned | `ENABLE_PASSPORT` etc. | 🔴 | UI hidden |
| VIN / OCR / Valuation / … | 🔵 | Planned | per-flag | — | Plugins |
| Industrial / Jobs / … | 🔴 | Planned | — | — | Not in marketplace core |

---

## Activated

_(empty — program start)_

## Feature-flagged (implemented, off)

_(track as activated)_

## Disabled with reason

| Item | Reason |
|------|--------|
| Consumer Trust Economy UI | Launch freeze / Group 2 hide |
| Escrow UI | `ENABLE_ESCROW=false` until Settlement Capability ready |
| Featured payments live | Await Payment Capability + webhook certification |

## Known limitations

- Launch Health dashboard still systems-oriented (DB/email/SMS/payments); Phase 11 expands to capability health.
- Direct Paystack usage may still exist in app paths — migrate behind Payment Capability.

## Launch readiness

| Gate | Status |
|------|--------|
| Constitution | ✅ Active |
| Lifecycle policy | ✅ Active |
| Activation program | ✅ Declared |
| Group 1 certified | ❌ |
| Ops Center (Phase 11) | ❌ |
| FAT | ❌ |
