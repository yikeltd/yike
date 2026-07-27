# Document 05 — Friction Framework

**Strategic Directive:** Strategic Audit of Friction & Conversion Balance  
**Governance Scope:** User Workflows, Onboarding, Lead Gateways, Verification Checkpoints  
**Status:** Frozen Strategy Baseline (Yike V2 Phase 0.5)  

---

## 1. Friction Philosophy

Friction is not inherently evil.
- **Bad Friction**: Frustrates users, delays actions, obscures information, or forces unnecessary steps without creating value (e.g. multi-page signup forms for casual search).
- **Good Friction (Trust Friction)**: Intentionally slows down high-stakes actions to verify authenticity, prevent fraud, and protect capital (e.g. requiring NIN check before granting a `Verified Agent` badge).

This framework audits every friction point across Yike, categorizes its impact, and prescribes the optimal design solution.

---

## 2. Friction Audit & Optimization Matrix

### 1. Registration Friction
- **Why It Exists**: To identify users and prevent spam accounts.
- **Evaluation**: Casual buyers MUST NOT be forced to complete full registration just to browse listings. Sellers MUST be verified before publishing listings.
- **Impact**: Hurts initial guest conversion if forced too early; creates essential safety if required for sellers.
- **Optimal Solution**: **Lazy Registration for Buyers** (browse freely; OTP signup required only when initiating contact). **Mandatory Phone/Email OTP for Sellers** before listing submission.

---

### 2. Messaging & Contact Friction
- **Why It Exists**: Captures lead attribution and prevents seller contact details from being scraped by bots.
- **Evaluation**: Must remain seamless while capturing lead metadata.
- **Impact**: Creates high attribution value and seller insights without blocking WhatsApp/Call routing.
- **Optimal Solution**: 1-click WhatsApp redirect that logs lead attribution silently in the background without modal blocking.

---

### 3. Calling Friction
- **Why It Exists**: Protects seller phone numbers from spam and enables call analytics.
- **Evaluation**: Unverified sellers should receive standard phone calls; high-tier sellers get virtual call routing.
- **Impact**: Enhances trust and lead quality.
- **Optimal Solution**: Unhide phone number on click for verified buyers; log call intent event automatically.

---

### 4. Viewing Scheduling Friction
- **Why It Exists**: Coordinates physical meeting dates between buyer and seller.
- **Evaluation**: Replaces informal verbal agreements with structured calendar requests.
- **Impact**: Reduces no-shows and increases deal closing velocity.
- **Optimal Solution**: Built-in 1-click "Schedule Viewing" button with date/time picker integrated into seller dashboard alerts.

---

### 5. Verification Friction
- **Why It Exists**: Validates identity (NIN) and corporate registration (CAC).
- **Evaluation**: Essential Good Friction. Must remain mandatory for verified badges.
- **Impact**: Slightly increases seller onboarding time ($< 5$ mins) but increases buyer trust by 300%.
- **Optimal Solution**: Automated OCR document upload with instant NIN/CAC verification feedback and progress tracker.

---

### 6. Inspection Friction
- **Why It Exists**: Requires 24-hour physical site visit by a Field Inspector.
- **Evaluation**: Necessary operational delay for physical asset validation.
- **Impact**: Creates high revenue (inspection fees) and eliminates buyer risk.
- **Optimal Solution**: Instant status updates ("Inspector Dispatched" $\to$ "Report Processing" $\to$ "Report Ready") displayed in buyer drawer.

---

### 7. Payment Friction
- **Why It Exists**: Billing checkout for subscriptions and trust services.
- **Evaluation**: Must be fast, transparent, and multi-channel (card, bank transfer, USSD).
- **Impact**: Enables smooth commercial monetization.
- **Optimal Solution**: Paystack/SafeHaven integration with instant payment verification and automatic invoice receipt generation.

---

### 8. Review Submission Friction
- **Why It Exists**: Prevents fake review manipulation.
- **Evaluation**: Only buyers with confirmed lead/connect history can leave reviews.
- **Impact**: Ensures 100% review authenticity.
- **Optimal Solution**: Automated post-transaction WhatsApp prompt sent 48 hours after scheduled viewing.

---

### 9. Subscription Upgrade Friction
- **Why It Exists**: Encourages sellers to select higher tiers (`PRO`, `PRIME`, `PINNACLE`).
- **Evaluation**: Must be completely transparent with zero hidden renewal traps.
- **Impact**: Drives predictable SaaS MRR.
- **Optimal Solution**: Role-aware plan presentation with clean duration picker and single-click checkout.

---

### 10. Trust Services Ordering Friction
- **Why It Exists**: Monetizes high-value physical inspection and legal title search add-ons.
- **Evaluation**: Should be available as 1-click add-ons directly on listing view pages.
- **Impact**: Generates high-margin transactional revenue.
- **Optimal Solution**: Contextual "Order Inspection" callout embedded directly within listing hero sections.
