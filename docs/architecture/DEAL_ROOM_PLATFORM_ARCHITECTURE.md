# Yike Transaction Workspace Platform Architecture Specification (Phase 1 to Phase 6 Certified)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & TRUST & VERIFICATION PLATFORM IMPLEMENTED

---

## 1. Executive Architecture Proposal & Core Concepts

A **Transaction Workspace** (UI label: **Deal Room**) is a secure, state-driven, multi-participant transaction workspace where high-value African property and vehicle deals progress from initial inquiry to final payment, escrow settlement, and review.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ YIKE TRANSACTION WORKSPACE PLATFORM                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ BUYER ]  [ SELLER ]  [ AGENT ]  [ FIELD INSPECTOR ]  [ LEGAL PARTNER ]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ TRUST & VERIFICATION CENTER (Weighted Trust Score Gauge 0–100 / KYC)  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ COMMUNICATION PLATFORM (Agora RTC Adapter / Voice Sessions / Presence) │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ APPOINTMENT & SCHEDULING ENGINE (Viewings, Inspections, Test Drives)   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ PINNED NEGOTIATION SUMMARY PANEL (Current vs Original, Difference, vN)│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ CONVERSATION INTELLIGENCE STREAM (Slack/Linear/Stripe Style Feed)     │  │
│  │ ├─ System Event Pills (Buyer Joined, Verification Approved)           │  │
│  │ ├─ User Chat Bubbles (Text, Attachments, Read Receipts)               │  │
│  │ ├─ Embedded Offer Cards (v1, v2 Counter, Accepted, Expired)           │  │
│  │ ├─ Embedded Verification Cards (Identity, Title, 94% Confidence)      │  │
│  │ └─ Embedded Document Cards (Title, Version, Verified Badge)           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Verification Aggregate   │ │ Universal Attachment      │ │ Universal │  │
│  │ (Evidence & Confidence)  │ │ Engine (Polymorphic Files)│ │ Comment   │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Negotiation Aggregate    │ │ Universal Legal Audit Log │ │ Search    │  │
│  │ (Immutable Git-Versions) │ │ Engine (Compliance)       │ │ Index     │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE & SECURE STORAGE LAYER (Supabase / PostgreSQL)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Trust & Verification Platform Architecture (Phase 6)

- **`VerificationAggregate`** (`src/lib/deal-room/trust/types.ts`): Independent domain aggregate for evidence-backed verifications (`identity`, `business`, `property`, `vehicle`, `ownership`, `title`, `inspection`, `phone`, `email`, `address`, `document`).
- **Weighted Trust Score Model (`TrustScoreCalculator`)**: Computes a 0–100 workspace trust score using weighted inputs from identity verifications (40%), document verifications (40%), and historical transaction completion (20%).
- **`VerificationService`** (`src/lib/deal-room/trust/service.ts`): Methods for `submitVerification()`, `approveVerification()`, confidence scoring, stream card embedding, audit logging, and automation hook emissions.
- **`TrustCenterPanel`** (`src/components/deal-room/trust-center-panel.tsx`): Banking KYC styled dashboard panel featuring a radial Trust Score Gauge, verification checklist, and evidence badges.

---

## 3. Code Architecture & Folder Structure

```text
src/
├── lib/
│   └── deal-room/
│       ├── types.ts                     # BaseEntity, OwnershipMetadata, TransactionWorkspace
│       ├── state-machine.ts             # Transaction state machine
│       ├── permissions.ts               # Role-based policy engine
│       ├── events.ts                    # Versioned timeline event bus
│       ├── audit.ts                     # Universal Audit Log framework
│       ├── attachments.ts               # Universal Attachment engine
│       ├── comments.ts                  # Universal Comment engine
│       ├── transaction.ts               # Business Execution Transaction Aggregate
│       ├── hooks.ts                     # Automation Hooks bus
│       ├── search.ts                    # Universal Search Index engine
│       ├── service.ts                   # Hardened core service layer
│       ├── conversation/                # Phase 2 Conversation Intelligence Layer
│       ├── negotiation/                 # Phase 3 Negotiation Engine
│       ├── appointments/                # Phase 4 Appointment & Scheduling Engine
│       ├── communications/              # Phase 5 Enterprise Communication Platform
│       ├── trust/                       # Phase 6 Trust & Verification Platform
│       │   ├── types.ts                 # VerificationAggregate & TrustScoreBreakdown
│       │   ├── service.ts               # VerificationService & TrustScoreCalculator
│       │   └── index.ts                 # Barrel exports
└── components/
    └── deal-room/
        ├── deal-room-shell.tsx          # Reusable Deal Room UI Shell
        ├── conversation-workspace.tsx   # Production Conversation Workspace UI
        ├── negotiation-summary-panel.tsx# Pinned Negotiation Summary UI
        ├── appointment-card.tsx         # Rich Embedded Appointment Card UI
        ├── voice-call-overlay.tsx       # FaceTime-styled In-Call UI
        └── trust-center-panel.tsx       # Banking-styled Trust Center Dashboard UI
```

---

## 4. Architectural Self-Audit (CTO Verification Questions)

1. **Did this phase introduce any architectural debt?**
   - **No.** Trust was implemented as an independent aggregate (`VerificationAggregate`) decoupled from messaging, calls, or payments. It publishes events to the existing `AutomationHookBus` and `DealRoomEventBus`.
2. **If Yike grew to 50 million users tomorrow, what in this phase would need to change?**
   - The in-memory `VerificationRepository` would transition to PostgreSQL database tables (`verifications`, `trust_scores`) with Redis caching for `TrustScoreCalculator`. The domain interfaces and service methods would remain 100% identical.
3. **What future phases are now simpler because of the work completed here?**
   - **Phase 7 (Document Vault)**: Documents will attach directly to `VerificationAggregate` as verified evidence.
   - **Phase 8 (Inspection Engine)**: Field verifiers will approve `inspection` verification records directly into `TrustScoreCalculator`.
   - **Phase 11 (Escrow & Payments)**: Escrow release conditions can evaluate `trustScore.overallScore >= 85` programmatically.
