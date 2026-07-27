# Document 01 — Domain Architecture Specification

**Technical Authority:** Highest Domain & Systems Architecture Specification  
**Governance Scope:** Subsystem Boundaries, Domain Platforms, Public Interfaces, Systems Topology  
**Status:** Frozen Architecture Baseline (Yike V2 Phase 0.75)  

---

## 1. Architectural Topology: Yike as a Multi-Platform Ecosystem

Yike is not a monolithic application or a single website. Yike is an orchestrated collection of **13 specialized domain platforms**, each maintaining distinct responsibilities, owned data stores, public contracts, and operational workflows.

```
                                    YIKE PLATFORM ECOSYSTEM
                                               │
   ┌───────────────────┬───────────────────────┼───────────────────────┬───────────────────┐
   │                   │                       │                       │                   │
┌──┴──────────┐ ┌──────┴──────┐         ┌──────┴──────┐         ┌──────┴──────┐     ┌─────┴────────┐
│  Identity   │ │  Discovery  │         │Communication│         │    Trust    │     │   Commerce   │
│  Platform   │ │  Platform   │         │  Platform   │         │  Platform   │     │   Platform   │
└─────────────┘ └─────────────┘         └─────────────┘         └─────────────┘     └──────────────┘
       │               │                       │                       │                   │
┌──────┴──────┐ ┌──────┴──────┐         ┌──────┴──────┐         ┌──────┴──────┐     ┌─────┴────────┐
│   Seller    │ │   Revenue   │         │ Operations  │         │Notification │     │ Search/Media │
│   Success   │ │  Platform   │         │  Platform   │         │  Platform   │     │  Platforms   │
└─────────────┘ └─────────────┘         └─────────────┘         └─────────────┘     └──────────────┘
```

---

## 2. Platform Specifications

---

### Platform 1: Identity Platform
- **Purpose**: Authenticate users, manage security credentials, govern account roles, and maintain user profiles.
- **Responsibilities**: Session management, OTP verification, PIN auth, profile repair, role governance (`individual`, `agent`, `dealer`, `landlord`, `company`, `developer`).
- **Owned Data**: `users`, `auth_sessions`, `profiles`, `user_roles`.
- **Public Contracts**: `getUserProfile()`, `authenticateSession()`, `validateUserRole()`.
- **Dependencies**: None (Core Foundation).

---

### Platform 2: Discovery Platform
- **Purpose**: Power listing discovery, property/vehicle marketplace views, intent hubs, and category navigation.
- **Responsibilities**: Listing publishing, category indexing, intent filtering, location taxonomies, hero rendering.
- **Owned Data**: `listings`, `listing_categories`, `locations`, `intent_mappings`.
- **Public Contracts**: `getListingBySlug()`, `queryActiveListings()`, `updateListingStatus()`.
- **Dependencies**: Identity Platform, Trust Platform.

---

### Platform 3: Communication Platform
- **Purpose**: Orchestrate direct buyer-seller interactions across WhatsApp, Direct Phone, Platform Chat, and Scheduled Viewings.
- **Responsibilities**: WhatsApp attribution deep-linking, direct phone routing, scheduled viewing calendar, message moderation screening.
- **Owned Data**: `conversations`, `messages`, `viewings`, `connect_audit_logs`.
- **Public Contracts**: `initiateConnect()`, `scheduleViewing()`, `dispatchMessage()`.
- **Dependencies**: Identity Platform, Discovery Platform, Notification Platform.

---

### Platform 4: Trust Platform
- **Purpose**: Execute identity checks, business audits, video verification, physical inspections, and calculate Trust Scores.
- **Responsibilities**: NIN validation, CAC filing verification, geotagged video audit, 50-point field inspection dispatch, dynamic Trust Score calculation.
- **Owned Data**: `verifications`, `field_inspections`, `trust_scores`, `trust_badges`.
- **Public Contracts**: `calculateTrustScore()`, `requestInspection()`, `verifyIdentity()`.
- **Dependencies**: Identity Platform, Operations Platform.

---

### Platform 5: Commerce Platform
- **Purpose**: Manage buyer transactions, legal title search checkouts, escrow deposits, and financial checkout gateways.
- **Responsibilities**: Paystack/SafeHaven payment integration, title search checkout, transaction receipts, escrow holds.
- **Owned Data**: `payments`, `transactions`, `escrow_accounts`, `title_orders`.
- **Public Contracts**: `initializeCheckout()`, `verifyPayment()`, `releaseEscrow()`.
- **Dependencies**: Identity Platform, Trust Platform.

---

### Platform 6: Seller Success Platform
- **Purpose**: Provide professional sellers with operating tools to manage active inventory, leads, and staff.
- **Responsibilities**: Seller Command Center, lead status pipeline (`New`, `Contacted`, `Viewing Set`, `Closed`), inventory health alerts, team seat allocation.
- **Owned Data**: `leads`, `seller_team_seats`, `inventory_health_logs`.
- **Public Contracts**: `getSellerDashboardMetrics()`, `updateLeadStatus()`, `assignLeadToAgent()`.
- **Dependencies**: Discovery Platform, Communication Platform, Subscription Platform.

---

### Platform 7: Revenue Platform
- **Purpose**: Monetize the marketplace via subscriptions, featured promotions, and advertising boosts.
- **Responsibilities**: Subscription plan governance (`CORE`, `PRO`, `PRIME`, `PINNACLE`), billing terms calculation, featured listing auctions, spot promotions.
- **Owned Data**: `subscriptions`, `billing_terms`, `promotions`, `ad_campaigns`.
- **Public Contracts**: `getActiveUserSubscription()`, `applyPromotionBoost()`, `calculateBilling()`.
- **Dependencies**: Identity Platform, Commerce Platform.

---

### Platform 8: Operations Platform
- **Purpose**: Power administrative command center (`/lex`), content moderation queues, verifier dispatches, and support ticketing.
- **Responsibilities**: Moderation queue processing, verifier assignment, field inspector QA, support ticket resolution, platform health monitoring.
- **Owned Data**: `moderation_queues`, `support_tickets`, `inspector_roster`, `admin_audit_logs`.
- **Public Contracts**: `processModerationQueue()`, `assignInspector()`, `resolveSupportTicket()`.
- **Dependencies**: All Platform Subsystems (Admin Control Layer).

---

### Platform 9: Notification Platform
- **Purpose**: Dispatch multi-channel system notifications (Email, SMS, Push, In-App, WhatsApp alerts).
- **Responsibilities**: Template rendering, dispatch rate-limiting, Resend/Sendchamp provider integration, delivery auditing.
- **Owned Data**: `notifications`, `notification_templates`, `dispatch_logs`.
- **Public Contracts**: `sendNotification()`, `dispatchEmailTemplate()`, `sendSMS()`.
- **Dependencies**: Identity Platform.

---

### Platform 10: Search Platform
- **Purpose**: Index marketplace assets for high-speed location, keyword, price, and spec queries.
- **Responsibilities**: Full-text indexing, spatial location queries (state/LGA/neighborhood), facet aggregation.
- **Owned Data**: `search_indexes`, `geo_spatial_grids`.
- **Public Contracts**: `searchListings()`, `reindexListing()`.
- **Dependencies**: Discovery Platform.

---

### Platform 11: Media Platform
- **Purpose**: Ingest, optimize, watermark, and deliver listing images, documents, and video walkthroughs.
- **Responsibilities**: Image resizing, WEBP compression, malware scanning, video transcode, storage pipeline.
- **Owned Data**: `media_assets`, `media_optimization_logs`.
- **Public Contracts**: `uploadMedia()`, `optimizeListingMedia()`.
- **Dependencies**: None (Utility Infrastructure).

---

### Platform 12: Analytics Platform
- **Purpose**: Aggregates marketplace usage metrics, lead attribution events, demand heatmaps, and seller performance.
- **Responsibilities**: Event ingestion, lead click tracking, price trend aggregation, seller conversion reporting.
- **Owned Data**: `analytics_events`, `demand_heatmaps`, `seller_metrics`.
- **Public Contracts**: `trackEvent()`, `getMarketplaceAnalytics()`.
- **Dependencies**: None (Async Ingestion Layer).

---

### Platform 13: AI Platform (Future Phase 5)
- **Purpose**: Power conversational natural language search, automated valuation benchmarks, and AI seller assistants.
- **Responsibilities**: LLM query processing, market price intelligence, fraud anomaly auto-detection.
- **Owned Data**: `valuation_models`, `ai_conversation_histories`.
- **Public Contracts**: `evaluateMarketPrice()`, `processNaturalLanguageSearch()`.
- **Dependencies**: Discovery Platform, Search Platform, Analytics Platform.
