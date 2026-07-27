# Document 04 — Service Catalog Specification

**Technical Authority:** Core Service Interface & Execution Contracts  
**Governance Scope:** Microservices / Service Layer Implementations, Inputs, Outputs, Side Effects  
**Status:** Frozen Architecture Baseline (Yike V2 Phase 0.75)  

---

## 1. Service Catalog Topology

The Yike backend logic is organized into **12 specialized domain services**. Each service encapsulates specific business operations, enforces input validation, returns predictable output contracts, and manages async side effects.

---

## 2. Service Specifications

---

### Service 1: Identity Service
- **Responsibilities**: Manage user authentication, phone/email verification OTPs, account security, and profile roles.
- **Inputs**: `credentials`, `otpCode`, `userId`, `profileData`.
- **Outputs**: `UserSession`, `UserProfile`, `VerificationStatus`.
- **Side Effects**: Emits `UserRegistered` event; writes session token to secure cookie.

---

### Service 2: Conversation Service
- **Responsibilities**: Manage platform chat messaging, WhatsApp deep-link generation, direct call routing, and message moderation.
- **Inputs**: `buyerId`, `sellerId`, `listingId`, `channel`, `messageText`.
- **Outputs**: `ConversationRecord`, `WhatsAppRedirectUrl`, `CallConnectRoute`.
- **Side Effects**: Emits `ConversationStarted` and `LeadCreated` events; dispatches push notifications.

---

### Service 3: Trust Service
- **Responsibilities**: Calculate dynamic Trust Scores (0–100), evaluate badge eligibility, and audit account risk.
- **Inputs**: `sellerId`, `verificationRecords`, `inspectionHistory`, `disputeCount`.
- **Outputs**: `TrustScoreResult { score, badges: [], penaltyPoints }`.
- **Side Effects**: Emits `TrustScoreUpdated` event; updates public seller badge cache.

---

### Service 4: Verification Service
- **Responsibilities**: Audit NIN credentials, CAC corporate registration documents, office address audits, and geotagged video walkthroughs.
- **Inputs**: `sellerId`, `documentType`, `documentNumber`, `mediaUrl`.
- **Outputs**: `VerificationAuditResult { status: "approved" | "rejected", reason }`.
- **Side Effects**: Grants `Verified Agent` / `Verified Business` badge; logs admin audit trail.

---

### Service 5: Inspection Service
- **Responsibilities**: Manage physical field inspection ordering, inspector dispatch, 50-point report ingestion, and badge attachment.
- **Inputs**: `listingId`, `buyerId`, `inspectionDate`, `inspectorReportData`.
- **Outputs**: `InspectionOrder`, `FieldReport { score, passed, reportPdfUrl }`.
- **Side Effects**: Emits `InspectionCompleted` event; attaches `Yike Inspected` badge to listing.

---

### Service 6: Lead Service
- **Responsibilities**: Capture, attribute, tag, and track buyer inquiries for seller management.
- **Inputs**: `sellerId`, `buyerMetadata`, `listingId`, `channel`, `statusTag`.
- **Outputs**: `LeadRecord`, `SellerLeadMetrics`.
- **Side Effects**: Pushes real-time alert to Seller Command Center.

---

### Service 7: Subscription Service
- **Responsibilities**: Govern subscription tier rules (`CORE`, `PRO`, `PRIME`, `PINNACLE`), calculate multi-month billing terms, enforce active listing limits.
- **Inputs**: `sellerId`, `planCode`, `billingMonths`, `paymentRef`.
- **Outputs**: `ActiveSubscription { planCode, activeListingLimit, expiresAt }`.
- **Side Effects**: Emits `SubscriptionActivated` event; updates seller capacity state.

---

### Service 8: Search Service
- **Responsibilities**: Execute full-text keyword, location facet, category filter, and price range marketplace queries.
- **Inputs**: `searchQueryParams { location, category, minPrice, maxPrice, verifiedOnly, page }`.
- **Outputs**: `PaginatedListingResults { items: [], totalCount, facets }`.
- **Side Effects**: Logs search query analytics asynchronously.

---

### Service 9: Media Service
- **Responsibilities**: Process uploaded media (images, PDFs, videos), apply optimization pipelines, generate WEBP thumbnails, scan for malware.
- **Inputs**: `rawFileBuffer`, `assetType`, `ownerId`.
- **Outputs**: `OptimizedMediaUrls { original, thumbnail, webp }`.
- **Side Effects**: Saves optimized media to S3/Cloud storage bucket.

---

### Service 10: Notification Service
- **Responsibilities**: Render and dispatch Emails, SMS, In-App Notifications, and Push Alerts via Resend/Sendchamp providers.
- **Inputs**: `recipientId`, `templateId`, `templateVariables`, `channel`.
- **Outputs**: `DispatchStatus { success: boolean, messageId }`.
- **Side Effects**: Logs delivery status in `dispatch_logs`.

---

### Service 11: Review Service
- **Responsibilities**: Validate buyer interaction history, ingest reviews and ratings (1–5 stars), manage seller responses.
- **Inputs**: `sellerId`, `buyerId`, `rating`, `commentText`.
- **Outputs**: `ReviewRecord`, `UpdatedSellerAverageRating`.
- **Side Effects**: Emits `ReviewSubmitted` event; triggers Trust Score recalculation.

---

### Service 12: Analytics Service
- **Responsibilities**: Ingest platform usage events, calculate conversion rates, generate market demand heatmaps and seller metrics.
- **Inputs**: `analyticsEvent { type, actorId, targetId, metadata }`.
- **Outputs**: `AnalyticsMetricsReport`, `DemandHeatmapData`.
- **Side Effects**: Writes event log to time-series analytics storage.
