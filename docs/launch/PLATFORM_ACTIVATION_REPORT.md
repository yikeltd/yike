# Platform Activation Report

**Living scorecard** for the [Enterprise Activation Program](./ENTERPRISE_ACTIVATION_PROGRAM.md).  
Update after each capability stage change. Do not leave blank/unknown rows.

**Last updated:** 2026-07-26  
**Overall:** NOT LAUNCH-CERTIFIED — Financial Platform Phase 1.5 (durable ledger) ready; apply migration + Coolify PIN pepper + Paystack FAT

---

## P0 blockers

| Item | Status | Notes |
|------|--------|-------|
| `YIKE_PIN_PEPPER` in Coolify | 🟡 Code ready | ≥32 chars required; production fail-fast; confirm Coolify |
| Apply `financial_ledger_immutable_v1` | 🟡 SQL ready | `20260726212317` — SQL Editor or db:push |
| Email OTP | 🟡 Audit | Browse-first policy; certify path |
| SMS OTP | 🟡 | Re-enable when provider proven; do not block if email sufficient |
| Featured / Paystack payments | 🟡 Scaffold | Routes via Financial Platform; flag off until FAT |
| Admin auth / PIN | 🟡 | Service-role PIN fix shipped; re-FAT after pepper set |

---

## Capability register

| Capability | Group | Lifecycle | Flag | Health | Notes |
|------------|-------|-----------|------|--------|-------|
| Listing Engine | 🟢 | Production | — | 🟡 | Engine-1 shipped; certify under load |
| YIP Runtime / Plugin Host | 🟢 | Production | — | 🟡 | Phase 1 certification |
| Knowledge Layer | 🟢 | Production | — | 🟡 | Catalogs live |
| Auth (email OTP / session) | 🟢 | Beta→Production | — | 🟡 | Certify |
| Auth SMS | 🟢 | Experimental/Beta | SMS flags | 🟡 | Re-enable when ready |
| **Financial Platform** | 🟢 | Beta | module flags | 🟡 | One capability · many modules · [docs](../architecture/FINANCIAL_PLATFORM.md) |
| ↳ Payment module | 🟢 | Beta | `ENABLE_PAYMENTS` | 🟡 | App routes migrated off direct service |
| ↳ Wallet module | 🟢 | Beta | `ENABLE_WALLET` | 🟡 | Agent wallet façade |
| ↳ Ledger module | 🟢 | Beta | — | 🟡 | Durable `financial_ledger_entries` · apply migration |
| ↳ Settlement module | 🟡 | Planned | `ENABLE_SETTLEMENT` | 🔴 | Framework only |
| Search | 🟢 | Beta | — | 🟡 | Complete autocomplete/ranking/saved |
| Trust (engine) | 🟢 | Beta | Trust Economy UI off | 🟡 | Backend scores; UI hidden |
| Media | 🟢 | Production | — | 🟢 | Add duplicate + video prep |
| Financing | 🟡 | Planned | `ENABLE_FINANCING` | 🔴 | UI hidden |
| Protection | 🟡 | Planned | `ENABLE_PROTECTION` | 🔴 | UI hidden |
| Verification / Passport / Registry | 🟡 | Planned | `ENABLE_PASSPORT` etc. | 🔴 | UI hidden |
| VIN / OCR / Valuation / … | 🔵 | Planned | per-flag | — | Plugins |
| Industrial / Jobs / … | 🔴 | Planned | — | — | Not in marketplace core |

---

## Activated

| Item | Notes |
|------|-------|
| Financial Platform Phase 0–1 | PIN pepper diagnostics · YIP plugin · route migration · Launch Health |
| Platform Constitution | Active |

## Feature-flagged (implemented, off)

| Item | Flag |
|------|------|
| Live Paystack checkout | `ENABLE_PAYMENTS` / `ENABLE_FEATURED_PAYMENTS` |
| Wallet UI / module | `ENABLE_WALLET` |
| Settlement | `ENABLE_SETTLEMENT` / `ENABLE_ESCROW` |

## Disabled with reason

| Item | Reason |
|------|--------|
| Consumer Trust Economy UI | Launch freeze / Group 2 hide |
| Escrow UI | Until Settlement module certified |
| Featured payments live | Await Paystack webhook FAT |

## Known limitations

- Apply `20260726212317_financial_ledger_immutable_v1.sql` on production before compliance reliance.
- Settlement / commission workflows are frameworks, not full business engines.
- Provider HTTP remains in `src/lib/payments/providers` (correct adapter layer).
- Launch Health warns if ledger table missing.
## Launch readiness

| Gate | Status |
|------|--------|
| Constitution | ✅ Active |
| Lifecycle policy | ✅ Active |
| Activation program | ✅ Declared |
| Financial Platform Phase 0–1 | ✅ Scaffold |
| Financial certification (live payments) | ❌ |
| Group 1 certified | ❌ |
| Ops Center (Phase 11) | 🟡 Launch Health expanded |
| FAT | ❌ |

**See:** [FINANCIAL_PLATFORM_CERTIFICATION.md](./FINANCIAL_PLATFORM_CERTIFICATION.md)
