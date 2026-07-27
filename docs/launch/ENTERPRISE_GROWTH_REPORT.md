# Enterprise Growth Report — Phase 2A + 2B

**Date:** 2026-07-26  
**Authority:** Founder roadmap (Financial certification → Growth activation)  
**Rule:** No new architecture — activate existing Capability Runtime / Financial / Trust / Listing / SEO / YIP surfaces.

---

## Sequence

```
Phase 2A Financial Certification
→ Sprint 1 Dealer Onboarding
→ Sprint 2 Trust Bridge
→ Sprint 3 Listing Quality Coach
→ Sprint 4 SEO Expansion
→ Sprint 5 Country Metadata
→ (later) Launch KE / GH / UG / RW
```

---

## Phase 2A — Financial Certification

### Outcome

Payment module is **code-certified**. Live production enablement remains a Coolify ops step after founder FAT ([PHASE_2A_PAYSTACK_FAT.md](./PHASE_2A_PAYSTACK_FAT.md)).

### Architecture decisions

- App continues to call `getFinancialPlatform()` → Payment module → Paystack provider.
- Flags stay **default false** in code; flip only via env after live FAT.
- Webhook event recording extracted to `paystack-events.ts` for testable idempotency without `server-only` coupling.

### Files changed

| Path | Role |
|------|------|
| `src/lib/payments/webhooks/paystack-events.ts` | Idempotent event recorder |
| `src/lib/payments/webhooks/paystack.ts` | Re-exports recorder; handler unchanged |
| `src/lib/payments/providers/__tests__/paystack-signature.test.ts` | HMAC FAT |
| `src/lib/payments/__tests__/flags-runtime.test.ts` | Flag + secret gate |
| `src/lib/payments/webhooks/__tests__/paystack-webhook-record.test.ts` | Dedupe |
| `docs/launch/PHASE_2A_PAYSTACK_FAT.md` | Live checklist |
| `docs/launch/PLATFORM_ACTIVATION_REPORT.md` | Scorecard update |
| `package.json` | `test:payments` script |

### Remaining launch blocker

- Founder completes live Paystack charge + webhook on production, then sets `ENABLE_PAYMENTS=true`.

---

## Sprint 1 — Dealer Onboarding

### Flow

`/agent/onboard` — six steps (business type → details → address → identity → branding → plan) → `/agent/plans`.

Business types map onto existing `Profile.account_type` (`dealer` / `agency` / `developer` / `agent`).

### Files

| Path | Role |
|------|------|
| `src/lib/dealer/business-types.ts` | Catalog + account mapping |
| `src/components/agent/dealer-onboard-wizard.tsx` | Wizard UI |
| `src/app/agent/onboard/page.tsx` | Route |
| `src/app/api/agent/dealer-onboard/route.ts` | Persist via existing profiles |
| `src/lib/profile/basic-listing-profile.ts` | `dealer` treated as business account |

---

## Sprint 2 — Trust Bridge

### Decision

Do **not** redesign Trust. `yip.trust` now delegates to listing-quality + agent verification signals via `createTrustPlatform()`.

Trust Economy UI / Passport remain launch-hidden.

### Files

| Path | Role |
|------|------|
| `src/lib/yip/capabilities/trust/platform.ts` | Façade |
| `src/lib/yip/plugins/builtins/trust.ts` | Enabled plugin + health |
| `src/lib/yip/trust/index.ts` | `createTrustService` → platform |
| YIP tests | Expect trust capability enabled |

---

## Sprint 3 — Listing Quality Coach

### Decision

Seller UI over existing `computeListingQualityScore` / `moderateListingDraft` — no second kernel.

### Files

| Path | Role |
|------|------|
| `src/lib/listing-quality.ts` | `buildListingQualityCoach` |
| `src/components/agent/listing-quality-coach.tsx` | UI |
| `src/components/listing-engine/listing-engine.tsx` | Mount on photos + review |

---

## Sprint 4 — SEO Expansion

### Decision

Extend programmatic SEO; reuse houses/search for property aliases.

### Routes

- `/cars`, `/cars/[make]`, `/cars/[make]/[model]` (make vs city resolved)
- `/properties` hub · `/properties/in/[city]` · `/properties/hub/[land|shortlet|commercial]`
  (listing detail remains `/properties/[slug]`)

### Files

| Path | Role |
|------|------|
| `src/lib/seo/vehicle-hubs.ts` | Make/model/city helpers |
| `src/app/(public)/cars/**` | Hubs |
| `src/app/(public)/properties/**` | Hubs + aliases |
| `src/lib/seo/sitemap-xml.ts` | Sitemap entries |

---

## Sprint 5 — Country Metadata

### Model

Config-only records for `NG | KE | GH | UG | RW` in `src/lib/country/config.ts`.

| Field | Purpose |
|-------|---------|
| currency / phone / timezone / languages | Localization prep |
| paymentProviders | Slot list (NG: paystack; others empty) |
| verificationProviders | Slot list |
| featureFlags | Per-market readiness |
| live | **Only NG true** |
| locationProvider | NG → nigeriaLocations via YIP |

Location knowledge refuses non-live countries.

---

## Trust scoring model (activated)

Signals (existing engines):

- Listing quality score / flags
- Verified listing / seller / business
- Photo count completeness
- Professional account type hints

Weights remain in existing listing-quality / agent-tier helpers — not hardcoded in the YIP façade.

---

## Multi-country readiness checklist

| Item | Status |
|------|--------|
| Country config records | ✅ |
| Nigeria live | ✅ |
| KE/GH/UG/RW prep (not live) | ✅ |
| Location knowledge gated | ✅ |
| Payment providers for other markets | ✅ empty slots |
| Launch Kenya+ | ❌ not started (intentional) |

---

## Remaining launch blockers

1. Live Paystack FAT + `ENABLE_PAYMENTS` in Coolify  
2. Group 1 capability load certification (broader activation program)  
3. Dealer acquisition / inventory (business, not engineering)  
4. Do **not** reopen homepage redesign unless usability regression  

---

## Validation

```bash
npm run test:payments
npm run test:yip
npx tsx --test src/lib/country/__tests__/config.test.ts
npm run lint
npm run typecheck
npm run build
```

## Confirmation

- No new frameworks or parallel runtimes.
- No search rewrite / auth rewrite / payment rewrite.
- No country hardcoding outside `src/lib/country/config.ts` + Nigeria location constants.
