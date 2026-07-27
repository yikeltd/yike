# Document 09 — Yike V2 Roadmap

**Authority Level:** Strategic Implementation Roadmap Authority  
**Governance Scope:** Multi-Phase Architecture Roadmap (Phases 0 through 5)  
**Status:** Frozen Baseline (Yike V2 Phase 0)  

---

## 1. Executive Phased Overview

```
Phase 0: Foundations (Documentation & Architecture Baseline)
   │
   ▼
Phase 1: Communication Platform (WhatsApp, Direct Voice/Video, Scheduled Viewings)
   │
   ▼
Phase 2: Trust Platform (NIN, CAC, Video Verification, Field Inspection Network)
   │
   ▼
Phase 3: Seller Success Platform (Command Center, Lead Manager, Inventory Analytics)
   │
   ▼
Phase 4: Revenue Platform (Subscription SaaS, Trust Services Billing, Ad Engine)
   │
   ▼
Phase 5: AI Platform (Conversational Search, Automated Price Intelligence, Deal Match)
```

---

## 2. Phase Breakdown

---

### Phase 0 — Foundations (Current Phase)

- **Objectives**: Establish the 10 definitive constitutional documents governing Yike V2 product architecture, design philosophy, UX doctrine, commercial model, and operational rules.
- **Deliverables**:
  - `docs/foundations/PRODUCT_CONSTITUTION.md`
  - `docs/foundations/CUSTOMER_JOURNEY_CONSTITUTION.md`
  - `docs/foundations/COMMUNICATION_PLATFORM_CONSTITUTION.md`
  - `docs/foundations/TRUST_PLATFORM_CONSTITUTION.md`
  - `docs/foundations/SUBSCRIPTION_AND_REVENUE_CONSTITUTION.md`
  - `docs/foundations/UX_CONSTITUTION.md`
  - `docs/foundations/OPERATIONS_CONSTITUTION.md`
  - `docs/foundations/DECISION_FRAMEWORK.md`
  - `docs/foundations/YIKE_V2_ROADMAP.md`
  - `docs/foundations/PRODUCT_GLOSSARY.md`
- **Dependencies**: Executive alignment on constitutional rules.
- **Risks**: Divergence between documentation and existing codebase if unmanaged.
- **Expected Outcomes**: 100% frozen constitutional clarity for future engineering sprints.
- **Success Criteria**: All 10 documents written, cross-referenced, and approved with zero code mutations.

---

### Phase 1 — Communication Platform

- **Objectives**: Upgrade Yike communication from basic links to a multi-channel transactional connect infrastructure.
- **Deliverables**:
  - Native WhatsApp Attribution Deep-Link Gateway.
  - Direct Voice Call Connect & Virtual Routing.
  - In-App Scheduled Viewing Calendar & Booking Engine.
  - Real-time Lead Dispatch Notifications (Email, SMS, In-App).
- **Dependencies**: Phase 0 Foundations complete.
- **Risks**: WhatsApp API rate limits or phone provider downtime.
- **Expected Outcomes**: Lead-to-Connect conversion rate increases by $> 35\%$.
- **Success Criteria**: Average buyer-to-seller connect latency under 30 seconds.

---

### Phase 2 — Trust Platform

- **Objectives**: Deploy the complete Yike Trust Engine for verification of identities, businesses, and physical assets.
- **Deliverables**:
  - NIN & Biometric Liveness Verification Module.
  - CAC Company Registration Automated Verification.
  - Geotagged Video Verification Pipeline.
  - Field Inspector Mobile Web Portal & Standard 50-Point Report Generator.
  - Dynamic Trust Score Calculation Engine.
- **Dependencies**: Phase 1 Communication Platform operational.
- **Risks**: Government API latency (NIN/CAC lookup providers).
- **Expected Outcomes**: Platform fraud reports drop to $< 0.01\%$.
- **Success Criteria**: Over 60% of active listings possess at least one verified badge.

---

### Phase 3 — Seller Success Platform

- **Objectives**: Provide professional agents, dealers, and developers with an operating system to manage inventory, leads, and staff.
- **Deliverables**:
  - Role-Aware Seller Command Center (Agent, Dealer, Developer, Landlord).
  - Advanced Lead Status Pipeline (`New`, `Contacted`, `Viewing Set`, `Closed`).
  - Inventory Health & Expiring Listing Alert System.
  - Team Account Management (Seats & Multi-Agent Lead Distribution for `PRIME` & `PINNACLE`).
- **Dependencies**: Phase 2 Trust Platform operational.
- **Risks**: Complex UI density cluttering mobile viewports.
- **Expected Outcomes**: Monthly active seller retention increases to $> 85\%$.
- **Success Criteria**: Average time to close listing leads reduced by 40%.

---

### Phase 4 — Revenue Platform

- **Objectives**: Fully commercialize the marketplace across recurring SaaS subscriptions, trust services, and featured advertising.
- **Deliverables**:
  - Automated Tiered Subscription Checkout (`CORE`, `PRO`, `PRIME`, `PINNACLE`).
  - Pay-Per-Use Trust Services Checkout (Physical Inspection, Legal Title Search).
  - Featured Listing & Spotlights Auction Engine.
  - Billing Terms Selector (Monthly, 3-Month, 6-Month, 12-Month with automated discount calculation).
- **Dependencies**: Phase 3 Seller Success Platform operational.
- **Risks**: Payment gateway drop-offs (Paystack/SafeHaven API downtime).
- **Expected Outcomes**: Monthly Recurring Revenue (MRR) grows predictably with zero reliance on manual billing.
- **Success Criteria**: Over 25% of active sellers upgraded to paid tiers (`PRO`, `PRIME`, `PINNACLE`).

---

### Phase 5 — AI Platform

- **Objectives**: Introduce intelligent automation to lower buyer search friction, predict asset pricing, and match buyers with verified deals.
- **Deliverables**:
  - Natural Language Conversational Search ("Find me a 3-bedroom terrace in Lekki Phase 1 under ₦120M with C of O").
  - Automated Price Intelligence & Valuation Benchmark Widget.
  - AI Seller Response Assistant for off-peak buyer inquiries.
  - Fraud Anomaly Auto-Detection Engine.
- **Dependencies**: Phases 1 through 4 operational with high-volume clean data.
- **Risks**: LLM hallucinations in property specs or price estimations.
- **Expected Outcomes**: Buyer discovery-to-lead conversion increases by $> 50\%$.
- **Success Criteria**: 90%+ accuracy in automated market valuation benchmarks.
