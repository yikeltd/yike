# Financial Platform

**Status:** ACTIVE — Phase 0 + Phase 1 scaffold  
**Capability ID:** `financial.platform`  
**Code:** `src/lib/yip/capabilities/financial/` · app façade `src/lib/financial/`  
**Authority:** Founder (Enterprise Activation · Financial domain)

> Payments are one module. Wallet, ledger, settlement, promotions, subscriptions, commissions, and refunds share one financial domain. Build the domain once.

---

## Architecture

```
Application (API routes, Lex, checkout)
        ↓
getFinancialPlatform()  — app façade (never import Paystack)
        ↓
Financial Capability (YIP plugin: yip.financial)
├── Payment Module
├── Wallet Module
├── Ledger Module
├── Transaction Module
├── Settlement Module
├── Subscription Module
├── Promotion Module
├── Commission Module
├── Refund Module
├── Provider Module
└── Audit Module
        ↓
Provider adapters (Paystack live · Flutterwave/Moniepoint/Stripe stubbed)
```

**Integration rules**

1. Application code talks only to `getFinancialPlatform()` or the registered YIP capability.
2. Only `src/lib/payments/providers/*` may call gateway HTTP.
3. Never bypass the Financial Platform for money movement.
4. This is a **capability**, not a new YIP infrastructure layer (Platform Constitution).

---

## Capability graph

| Module | Role | Flag |
|--------|------|------|
| Payment | Initialize, authorize, verify, webhook, refund, idempotency | `ENABLE_PAYMENTS` / `ENABLE_FEATURED_PAYMENTS` |
| Wallet | Financial identity: available/pending, credits, reserves | `ENABLE_WALLET` |
| Ledger | Append-only source of truth | always on (in-memory → DB next) |
| Transaction | Lifecycle states for every financial op | always on |
| Settlement | Generic settlement engine (not business escrow UI) | `ENABLE_SETTLEMENT` / `ENABLE_ESCROW` |
| Promotion | Featured, boost, ads credits | `ENABLE_PROMOTIONS` (or payments) |
| Subscription | Dealer/pro plans, renewals | `ENABLE_SUBSCRIPTIONS` (or payments) |
| Commission | Marketplace / referral fees | `ENABLE_COMMISSIONS` |
| Refund | Manual/auto, wallet/gateway, partial | `ENABLE_REFUNDS` (default on) |
| Provider | Provider registry / health | always on |
| Audit | Actor, amount, status, correlation, risk | always on |

Activation is **configuration only** — no redeploy required to flip flags.

---

## Provider flow

```
Checkout / webhook
  → Financial.payment
  → payment-service (order + reconcile)
  → ProviderResolver → paystackProvider
  → Paystack API
```

Future providers plug into Provider Module without changing app routes.

---

## Ledger model

- Every financial event becomes ledger entries (credit + debit pair preferred).
- Entries are **immutable** — append only; never update or delete.
- Types: payment, refund, commission, wallet_credit/debit, settlement, promotion_credit, subscription, adjustment, reserve, release.
- Current implementation: in-process ring buffer for certification.
- Next: Postgres immutable ledger table migration (append-only RLS).

---

## Transaction lifecycle

`pending → authorized → processing → completed | failed | cancelled | expired | refunded | reversed`

Tracked by Transaction Module; durable orders remain in `payment_orders`.

---

## Wallet lifecycle

Wallet is financial identity, not a single balance field:

- Available · Pending · Credits · Promotional credits · Refunds · Bonuses · Adjustments · Reserved · Future escrow/financing
- Today: agent wallet ledger via Wallet Module (`ENABLE_WALLET`)
- All adjustments should also append Ledger + Audit records (hardening in progress)

---

## Settlement lifecycle

Generic engine — marketplace settlement, vendor payouts, commission settlement, refund settlement, future escrow.  
Business escrow UI stays behind launch flags until Settlement is certified.

---

## Refund flow

```
Request → Refund Module → Payment.refund and/or Wallet.credit
       → Ledger append → Audit record → (optional) approval workflow
```

---

## Security

| Control | Status |
|---------|--------|
| `YIKE_PIN_PEPPER` ≥32 chars | Phase 0 — production fail-fast |
| Never trust client amount | Enforced in payment initialize routes |
| Webhook HMAC | Paystack signature verify |
| Idempotent webhooks | Duplicate detection in webhook store |
| Service-role for money writes | Admin client pattern |

---

## Feature flags

See `src/lib/yip/capabilities/financial/flags.ts` and `.env.example`.

---

## Launch Command Center

Lex Launch Health surfaces:

- PIN Pepper
- Financial Platform (module enablement)
- Payments / Wallet / Settlement

`/api/admin/env-health` includes length-aware PIN pepper status.

---

## Related docs

- [FINANCIAL_PLATFORM_CERTIFICATION.md](../launch/FINANCIAL_PLATFORM_CERTIFICATION.md)
- [ENTERPRISE_ACTIVATION_PROGRAM.md](../launch/ENTERPRISE_ACTIVATION_PROGRAM.md)
- [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md)
