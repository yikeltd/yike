# Financial Platform Certification

**Domain:** Financial Platform (`financial.platform`)  
**Phases:** 0 (PIN pepper) + 1 (capability scaffold + payment migration)  
**Date:** 2026-07-26  
**Status:** Phase 0–1 CERTIFIED FOR CONTINUE — not full launch-certified

---

## Launch checklist

### Phase 0 — Security

| Check | Status |
|-------|--------|
| Generate strong `YIKE_PIN_PEPPER` (≥32 chars) in Coolify | ⬜ Ops |
| Startup validates pepper length | ✅ `assertPinPepperProductionReady` |
| Fail fast in production if missing/weak | ✅ |
| Diagnostics in Launch Health + env-health | ✅ |
| No production deploy without pepper | ✅ code gate — confirm Coolify set before ship |

### Phase 1 — Financial Capability

| Check | Status |
|-------|--------|
| Single Financial Capability with modules (not N top-level caps) | ✅ |
| Path `src/lib/yip/capabilities/financial/` | ✅ |
| YIP plugin `yip.financial` registered | ✅ |
| App façade `getFinancialPlatform()` | ✅ |
| API routes do not import payment-service / Paystack | ✅ |
| Paystack only behind provider adapter | ✅ |
| Immutable ledger module (append-only) | ✅ in-memory |
| Wallet module operational behind flag | ✅ |
| Settlement / Promotion / Subscription / Commission / Refund frameworks | ✅ stubs + flags |
| Transaction + Audit modules | ✅ |
| Feature flags config-only | ✅ |
| Launch Health financial rows | ✅ |
| Unit / ledger / transaction / plugin tests | ✅ `npm run test:yip` |
| DB-backed immutable ledger | ✅ migration `20260726212317` — apply on production |
| Settlement business workflows | ⬜ Phase 2+ |
| Full webhook + Paystack FAT on production | ⬜ before ENABLE_PAYMENTS=true |
| Payment/wallet events → ledger + audit | ✅ wired (fail-soft) |
| Launch Health ledger + payment queue | ✅ |

---

## Success criteria (founder brief)

| Criterion | Phase 1 |
|-----------|---------|
| No application communicates directly with payment providers | ✅ routes via Financial Platform |
| Every financial operation flows through Financial Platform | ✅ new path; legacy service remains internal adapter |
| Immutable ledger implemented | ✅ durable table + memory fail-soft |
| Wallet operational | ✅ behind `ENABLE_WALLET` · ledger events |
| Payment capability certified | 🟡 route migration + ledger write; live Paystack FAT pending |
| Settlement / Promotion / Subscription / Refund frameworks | ✅ ready; deepen workflows later |
| Launch Command Center reports financial health | ✅ |
| All financial capabilities integrated through YIP | ✅ one capability, modules |

---

## Feature flags (Coolify / `.env`)

```bash
ENABLE_PAYMENTS=false
ENABLE_FEATURED_PAYMENTS=false   # legacy alias
ENABLE_WALLET=false
ENABLE_SETTLEMENT=false
ENABLE_PROMOTIONS=false
ENABLE_SUBSCRIPTIONS=false
ENABLE_COMMISSIONS=false
ENABLE_REFUNDS=true
YIKE_PIN_PEPPER=<random ≥32 chars>
```

---

## Ops note before production toggle

1. Set `YIKE_PIN_PEPPER` in Coolify (≥32). Redeploy if process was started without it.
2. Confirm Paystack keys + webhook URL `https://yike.ng/api/payments/webhook`.
3. Flip `ENABLE_PAYMENTS=true` only after webhook FAT.
4. Apply migration `20260726212317_financial_ledger_immutable_v1.sql` on production (SQL Editor or `npm run db:push`) before treating ledger as compliance source of truth.

---

## Sign-off

| Role | Sign |
|------|------|
| Engineering | Phase 0–1 scaffold complete |
| Founder | Pending Coolify pepper + payment FAT |
