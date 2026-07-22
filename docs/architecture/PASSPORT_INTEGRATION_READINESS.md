# Passport Integration Readiness — Yike

**Status:** Preparation only — **do not implement Passport**  
**Baseline:** Architecture Audit approved 2026-07-22  
**Principle:** Yike **consumes** Stankings Passport; it never creates identities
or owns the Trust Engine.

Canonical contracts (ecosystem):

- BamSignal `docs/architecture/STANKINGS_PASSPORT.md`
- BamSignal `docs/architecture/PASSPORT_IDENTIFIER_STANDARD.md` (`SKL-XXXX-XXXX`)
- BamSignal `docs/architecture/DIGITAL_TRUST_MODEL.md`

---

## 1. Trust signal inventory (marketplace contributions)

Signals Yike can contribute to Passport later (product-owned events → shared
trust layer). These are **candidates**, not a live Passport emitter.

| Signal family | Source today | Entity | Contribution intent |
|---------------|--------------|--------|---------------------|
| Seller verification level | `seller_verifications` / profile fields | User / seller | Identity confidence input |
| Property physical verification | `property_verification_*` | Listing | Listing authenticity |
| Listing health / quality | `src/lib/trust/quality*` | Listing | Supply quality |
| Listing staleness | `src/lib/trust/listing-staleness.ts` | Listing | Freshness |
| Image quality | `src/lib/trust/image-quality.ts` | Listing media | Media authenticity |
| Local trust_scores | `trust_scores` table + score-engine | user / listing / agent | Interim; map to Passport signals |
| Trust events | `recordTrustScoreEvent` | entity | Event timeline contribution |
| WhatsApp verification | feature-flagged flows | User / listing contact | Contact authenticity |
| Listing reports & outcomes | `listing_reports` + moderation | Listing / reporter | Abuse / integrity |
| Agent response / lead outcomes | leads pipeline | Agent | Behaviour / reliability |
| Admin audit actions | `src/lib/admin/audit*` | Staff → entity | Audit trail (ops) |

**Do not export** raw NIN/bank secrets or PII into Passport payloads — only
verification *state* and explainable signal types under consent.

---

## 2. Identifier bind points

Passport ID format: `SKL-XXXX-XXXX` (immutable). Products never mint Passport IDs.

| Marketplace entity | Current ID | Proposed bind |
|--------------------|------------|---------------|
| Human user / seller | `auth.users.id` / `profiles.id` (UUID) | `profiles.passport_id` (nullable text, unique) when SDK available |
| Agent persona | Same profile or agent slug | Same Passport; product profile remains Yike-owned |
| Listing | `properties.id` | Stays product-owned; trust signals reference listing + owner Passport |
| Agency / business | Company / agency profile rows | Bind controlling humans’ Passports; org credentials TBD at Stankings |

**No schema migration in this sprint.** Future migration sketch only:

```sql
-- FUTURE (do not apply now)
-- alter table profiles add column passport_id text unique;
-- alter table profiles add column passport_bound_at timestamptz;
```

---

## 3. Integration points (application)

| Layer | Touchpoint | Action when integrating |
|-------|------------|-------------------------|
| Auth session | `src/lib/auth*` · Supabase session | After login, resolve/bind Passport via shared SDK |
| Profile | `profiles` | Store Passport ID; never duplicate identity fields as SSOT |
| Trust UI | badges, trust center | Prefer Passport explainability APIs over local score as authority |
| Moderation | `/lex` | Continue local ops; emit integrity signals upstream |
| Launch gate | `src/lib/launch-mode` `passport_ui` | Keep Passport UI off until consumer SDK ready |
| Webhooks / jobs | cron trust recalculate | Dual-write period: local score + Passport signal emit |

---

## 4. Consent & trust contribution flows

```text
User
  → authenticates (Yike / shared auth)
  → consents to Passport bind (Stankings consent ledger — consume, don't invent)
  → Yike stores passport_id on profile
  → marketplace actions emit typed signals (verification, listing integrity, …)
  → Passport derives explainable confidence
  → Yike displays Passport outcomes + marketplace badges
```

Rules:

1. No silent bind — explicit consent UX owned by shared consent model.
2. Yike may keep **marketplace-local** moderation scores for ops; they are not
   the constitutional trust score.
3. Withdrawal / lifecycle follows Passport lifecycle docs when published.

---

## 5. Schema / config changes required (future)

| Change | Required? | When |
|--------|-----------|------|
| `profiles.passport_id` (+ bound_at) | Yes | First Passport consumer sprint |
| Signal outbox table (idempotent emits) | Recommended | Before production emit |
| Feature flag `ENABLE_PASSPORT_UI` / launch-mode | Yes (registry exists) | Already prepared |
| RLS for passport columns | Yes | With migration |
| Remove dual ownership of identity email/phone SSOT | Progressive | After Passport is source of truth |

**Out of scope now:** Passport engine, SKL generator, consent ledger DB, scoring canon.

---

## 6. Readiness score (prep)

| Dimension | Prep status |
|-----------|-------------|
| Signal inventory | Documented |
| Bind plan | Documented |
| Consent flow design | Documented (consume shared) |
| Schema applied | Not started (correct) |
| SDK / runtime integration | Blocked on Stankings/BamSignal publish |
| Vehicle vertical dependency | Vehicles wait until this prep + constitutional alignment complete |

**Prep readiness:** sufficient to start a future Passport consumer sprint after
shared SDK availability. **Implementation readiness:** not started by design.

---

## Gate

Vehicle Marketplace implementation must not begin until this preparation is
accepted and constitutional alignment docs are in place — so vehicles inherit
Passport/trust consumption patterns rather than creating parallel identity.
