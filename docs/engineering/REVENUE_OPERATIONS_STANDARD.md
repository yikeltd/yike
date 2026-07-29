# Yike Revenue Operations Standard & Architecture Manual

> **Status:** Production Standard  
> **Authority:** Financial Platform & Revenue Engineering  
> **Last Audit:** 2026-07-29

---

## 1. Executive Summary

Yike Revenue Operations (RevOps) is the unified commercial backbone powering all monetization across the marketplace platform. No feature or product module implements custom payment handlers, ad-hoc provider integrations, or independent receipt generation. All paid products map into the single **Financial Platform Pipeline**.

---

## 2. Platform Architecture & Modular Inventory

### 2.1 Unified Product Inventory

| Product / Purpose | Plan / Tier | Provider Support | Fulfillment Handler |
| :--- | :--- | :--- | :--- |
| **Seller Subscriptions** | Core, Pro, Elite, Prime | Paystack & Korapay | `fulfillSubscriptionPayment` |
| **Featured Listings** | 24 Hours, 7 Days, 30 Days | Paystack & Korapay | `fulfillFeaturedListingOrder` |
| **Listing Boost** | 24 Hours, 7 Days | Paystack & Korapay | `fulfillListingBoostOrder` |
| **Spotlight & Advertisements** | Hero, Category, Section, Enterprise | Paystack & Korapay | `fulfillAdvertisementPayment` |
| **Live Inspection** | Configurable (Free/Paid) Order | Paystack & Korapay | `fulfillLiveInspectionOrder` |
| **Property Verification** | Document & On-Site Verification | Paystack & Korapay | `fulfillPropertyVerification` |
| **Seller Verification** | Identity & Business Badge Fees | Paystack & Korapay | `fulfillSellerVerification` |
| **Escrow & Wallet (Roadmap)** | BayRight Integration Gate | Paystack & Korapay | `fulfillEscrowWalletDeposit` |

---

## 3. Unified Payment Pipeline & Lifecycle

Every monetization product follows the exact 12-step operational sequence:

```text
[Create Order] -> [Pending] -> [Choose Provider (Paystack/Korapay)] 
       -> [Gateway Checkout] -> [Provider Webhook / Callback] 
       -> [HMAC Signature & Transaction Verification] -> [Fulfillment Handler Execution] 
       -> [Receipt & Invoice Generation] -> [Multi-Channel Notification Dispatch] 
       -> [Revenue Analytics Aggregation] -> [Immutable Audit Log] -> [Success]
```

### 3.1 Order Structure & Integrity (`payment_orders`)

Every transaction generates a standardized `PaymentOrder` entry prior to gateway redirection:

- `id` (UUID)
- `user_id` (UUID)
- `purpose` (`PaymentPurpose` enum)
- `amount` (Server-validated Integer in Kobo / NGN)
- `currency` (`NGN`)
- `provider` (`paystack` | `korapay`)
- `reference` (Unique prefix-coded reference, e.g., `YIK-SUB-xxx`, `YIK-ADV-xxx`)
- `status` (`pending` -> `paid` -> `completed` / `failed`)
- `metadata` (JSONB containing target listing ID, plan code, campaign parameters)

---

## 4. Multi-Gateway Provider Standardization

The system uses a provider-agnostic adapter architecture (`src/lib/payments/providers/`):

1. **Paystack Adapter (`src/lib/payments/providers/paystack.ts`)**:
   - HMAC-SHA256 signature validation (`x-paystack-signature`).
   - Standardized initialization and verification requests.
2. **Korapay Adapter (`src/lib/payments/providers/korapay.ts`)**:
   - HMAC-SHA256 signature validation (`x-korapay-signature`).
   - Seamless fallback when primary gateway experiences latency spikes.

---

## 5. Fulfillment Handlers (`src/lib/payments/fulfillment/`)

Fulfillment logic is decoupled from HTTP controllers and UI components. When verification succeeds:

- `subscription`: Invokes `activateSubscriptionFromPayment()`
- `advertisement`: Invokes `activateAdvertisementFromPayment()`
- `featured_listing`: Invokes `activateFeaturedListingFromPayment()`
- `boost_listing`: Invokes `activateListingBoostFromPayment()`
- `live_inspection`: Invokes `fulfillLiveInspectionOrder()`
- `property_verification`: Invokes `fulfillPropertyVerificationOrder()`

---

## 6. Receipts, Invoices & Financial Reporting

- **Invoices & Receipts**: Standardized format (`YIK-INV-YYYYMMDD-XXXX` and `YIK-REC-YYYYMMDD-XXXX`) generated for every completed transaction.
- **Analytics Aggregation**: System streams metrics into `getAdvertisingDashboardMetrics()` and `/api/revenue/overview` tracking:
  - Daily, Monthly, and Annual Revenue.
  - Revenue breakdown by Provider (Paystack vs Korapay).
  - Revenue breakdown by Product (Subscriptions, Featured, Advertisements, Inspections).
  - Average Order Value (AOV), Conversion Rates, and Failure Rates.

---

## 7. Audit Logging & Security Control

Every state change creates an immutable entry in `logPaymentAudit()` recording:
- Event action (`order_created`, `payment_started`, `webhook_received`, `verification_passed`, `fulfillment_completed`, `receipt_generated`).
- Actor ID (User, System Cron, or Staff Admin).
- IP Address and User-Agent signature.
- Verification checksums.

---

## 8. Guide: Onboarding a New Paid Product

To add a new paid product to Yike in the future, follow this 3-step protocol:

1. **Register Purpose**: Add purpose identifier to `PaymentPurpose` union in `src/lib/payments/types.ts`.
2. **Implement Fulfillment Handler**: Create `src/lib/payments/fulfillment/[product].ts` export.
3. **Configure Catalog Pricing**: Add product server-side pricing rule to `src/lib/payments/catalog.ts`.

Everything else (order creation, gateway selection, webhook handling, receipts, invoices, audit logs, and analytics) executes automatically.
