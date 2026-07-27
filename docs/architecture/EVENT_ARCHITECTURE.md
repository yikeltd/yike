# Document 03 — Event Architecture Specification

**Technical Authority:** Event-Driven Architecture & Message Payload Contracts  
**Governance Scope:** Domain Events, Producers, Consumers, Event Bus, System Integration  
**Status:** Frozen Architecture Baseline (Yike V2 Phase 0.75)  

---

## 1. Event-Driven Architecture Overview

To maintain loose coupling, high performance, and asynchronous processing, Yike utilizes a **Domain Event Architecture**. Platforms emit immutable business events when state changes occur. Consuming platforms react to these events without direct tight coupling.

```
┌──────────────────┐               ┌───────────────────┐               ┌──────────────────┐
│ Event Producer   │──────────────>│   Yike Event Bus  │──────────────>│ Event Consumers  │
│ (e.g. Discovery) │  Emits Event  │ (In-Memory / Queue)│  Dispatches   │ (e.g. Analytics) │
└──────────────────┘               └───────────────────┘               └──────────────────┘
```

---

## 2. Core Domain Event Specifications

---

### Event 1: `ListingCreated`
- **Producer**: Discovery Platform
- **Consumers**: Analytics Platform, Moderation Queue (Operations Platform)
- **Data Payload**: `{ listingId, sellerId, category, price, location, createdAt }`
- **Purpose**: Triggers automated content moderation filters and logs inventory creation metrics.
- **Future Integration**: AI anomaly detector for price/location fraud analysis.

---

### Event 2: `ListingPublished`
- **Producer**: Operations Platform (Moderation Approval) / Discovery Platform
- **Consumers**: Search Platform, Notification Platform, Seller Success Platform
- **Data Payload**: `{ listingId, sellerId, slug, title, publishedAt }`
- **Purpose**: Indexes listing in Search Engine, notifies seller via SMS/Email, updates seller command center active count.

---

### Event 3: `ConversationStarted`
- **Producer**: Communication Platform
- **Consumers**: Seller Success Platform, Analytics Platform, Lead Service
- **Data Payload**: `{ conversationId, buyerId, sellerId, listingId, channel: "whatsapp" | "call" | "chat", startedAt }`
- **Purpose**: Creates an attributed lead entry in seller management and logs buyer engagement metrics.

---

### Event 4: `VideoVerificationCompleted`
- **Producer**: Trust Platform
- **Consumers**: Discovery Platform, Trust Score Engine, Operations Platform
- **Data Payload**: `{ verificationId, listingId, sellerId, mediaUrl, status: "approved" | "rejected", timestamp }`
- **Purpose**: Attaches geotagged video badge to listing hero card and updates seller Trust Score.

---

### Event 5: `InspectionRequested`
- **Producer**: Trust Platform / Commerce Platform
- **Consumers**: Operations Platform (Inspector Dispatch), Notification Platform
- **Data Payload**: `{ inspectionId, listingId, buyerId, propertyAddress, preferredDate, paymentReference }`
- **Purpose**: Dispatches request to nearest certified Field Inspector and notifies buyer of order receipt.

---

### Event 6: `InspectionCompleted`
- **Producer**: Operations Platform (Field Inspector App)
- **Consumers**: Trust Platform, Discovery Platform, Notification Platform, Buyer Drawer
- **Data Payload**: `{ inspectionId, listingId, inspectorId, score: 0-100, reportUrl, passed: boolean, timestamp }`
- **Purpose**: Attaches `Yike Inspected` badge to listing, publishes 50-point report, and notifies buyer.

---

### Event 7: `BuyerAssistanceRequested`
- **Producer**: Communication Platform / Support Module
- **Consumers**: Operations Platform (Concierge Desk), Notification Platform
- **Data Payload**: `{ requestId, buyerId, targetLocation, budgetRange, assetType, requestedAt }`
- **Purpose**: Routes high-intent buyer request to dedicated Buyer Assistance Concierge officer.

---

### Event 8: `TrustScoreUpdated`
- **Producer**: Trust Platform
- **Consumers**: Identity Platform, Discovery Platform, Seller Success Platform
- **Data Payload**: `{ sellerId, previousScore, newScore, updatedBreakdown, timestamp }`
- **Purpose**: Recalculates seller profile badge level and updates public listing credibility indicators.

---

### Event 9: `ReviewSubmitted`
- **Producer**: Identity Platform / Trust Platform
- **Consumers**: Trust Score Engine, Seller Success Platform, Discovery Platform
- **Data Payload**: `{ reviewId, sellerId, buyerId, rating: 1-5, comment, verifiedDeal: boolean, timestamp }`
- **Purpose**: Updates seller average rating, recalculates Trust Score reputation component, and displays verified review on profile.

---

### Event 10: `SubscriptionActivated`
- **Producer**: Revenue Platform / Commerce Platform
- **Consumers**: Discovery Platform (Listing Limit Check), Seller Success Platform, Notification Platform
- **Data Payload**: `{ subscriptionId, sellerId, planCode: "pro_agent" | "agency" | "developer", listingLimit, expiresAt }`
- **Purpose**: Expands seller active listing capacity, unlocks priority lead tools, issues invoice email.

---

### Event 11: `LeadCreated`
- **Producer**: Communication Platform
- **Consumers**: Seller Success Platform, Notification Platform, Analytics Platform
- **Data Payload**: `{ leadId, sellerId, buyerId, listingId, channel, leadStatus: "new", createdAt }`
- **Purpose**: Pushes real-time lead alert to Seller Command Center and triggers instant push notification.

---

### Event 12: `ViewingScheduled`
- **Producer**: Communication Platform
- **Consumers**: Seller Success Platform, Notification Platform, Calendar Service
- **Data Payload**: `{ viewingId, listingId, buyerId, sellerId, scheduledDate, locationText, status: "pending" }`
- **Purpose**: Adds appointment to seller/buyer calendar and dispatches confirmation alerts.

---

### Event 13: `DealCompleted`
- **Producer**: Commerce Platform / Seller Success Platform
- **Consumers**: Discovery Platform (Mark as Sold), Trust Score Engine, Analytics Platform
- **Data Payload**: `{ dealId, listingId, sellerId, buyerId, transactionAmount, completedAt }`
- **Purpose**: Marks listing as `Sold`/`Rented` immediately, triggers review prompt, updates completed deal metrics.
