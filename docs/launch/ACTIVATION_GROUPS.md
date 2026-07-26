# Activation Groups — Launch Readiness

**Authority:** Founder (2026-07-26)  
**Program:** [ENTERPRISE_ACTIVATION_PROGRAM.md](./ENTERPRISE_ACTIVATION_PROGRAM.md)  
**Lifecycle:** [CAPABILITY_LIFECYCLE.md](../architecture/CAPABILITY_LIFECYCLE.md)

Do this **systematically**. Do not turn everything on.

---

## 🟢 Group 1 — Production-ready before launch (enable / fix now)

Core marketplace experience.

| Area | Scope |
|------|--------|
| **Authentication** | SMS (re-enable when proven) · Email OTP · Password reset · Session management · Admin auth |
| **Payments** | Featured / promotions · Paystack webhooks · Failed recovery · Refunds (where applicable) · Audit trail · Lex reconciliation — via **Payment Capability** |
| **Wallet** | Recommend **on** before launch as financial hub (refunds, promo credits, future commissions/escrow) — `ENABLE_WALLET` |
| **Search** | Autocomplete · typo tolerance · ranking · recent · popular · saved |
| **Trust (backend)** | Seller / listing quality / verification / photo / completion / response / fraud confidence — engine on; Trust Economy UI may stay hidden |
| **Media** | Already strong · add duplicate detection · video upload preparation |

**P0 env:** `YIKE_PIN_PEPPER` must be configured in production.

---

## 🟡 Group 2 — Build now, hide UI

Exist and work; consumer UI behind flags.

| Capability shape | Flag (examples) | Notes |
|------------------|-----------------|-------|
| Settlement (Escrow) | `ENABLE_ESCROW=false` | Settlement Capability, not ad-hoc escrow |
| Financing / Mortgage | `ENABLE_FINANCING` / `ENABLE_MORTGAGE` | Calculators · products · eligibility behind flag |
| Protection / Insurance | `ENABLE_PROTECTION` / `ENABLE_INSURANCE` | |
| National Registry | `ENABLE_NATIONAL_REGISTRY` | Interfaces + plugins |
| Passport | `ENABLE_PASSPORT` | Verification · trust grade · business · identity · history · reputation — **UI hidden** |

---

## 🔵 Group 3 — Platform capabilities (plugins)

Think plugins, not screens. Most stay disabled until certified.

VIN · OCR · Vehicle History · Property Valuation · Fraud · Neighborhood · Inspection · School Rating · Flood Risk · Maps · Delivery · …

Register through YIP; enable via flags when ready.

---

## 🔴 Group 4 — Future products (installable, not baked into marketplace)

Do **not** build into the core marketplace app.

Industrial · Hospitality · Business listings · Workforce · Auction · Developer API  

These become installable capability packs / vertical plugins when the business is ready (same pattern as Yike Agriculture / Jobs / Boats in the constitution).

---

## Capability naming (preferred)

| Don’t build as | Build as |
|----------------|----------|
| Paystack-only payments | **Payment Capability** (+ providers) |
| Escrow | **Settlement Capability** |
| Insurance | **Protection Capability** |
| Mortgage | **Financing Capability** |
| National Registry | **Verification Capability** (+ providers) |

---

## Mapping to lifecycle stages

| Group | Typical stage at launch |
|-------|-------------------------|
| 🟢 | **Production** (or Beta with founder-accepted residual risk) |
| 🟡 | **Beta** (flag off) or **Experimental** |
| 🔵 | **Planned** → **Experimental** → **Beta** as built |
| 🔴 | **Planned** only until product decision |
