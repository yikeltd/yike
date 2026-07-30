# Yike Transaction Workspace Platform Architecture Specification (Phase 1, 1.5, 2 & Phase 3 Hardened)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & NEGOTIATION ENGINE IMPLEMENTED

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
│  │ PINNED NEGOTIATION SUMMARY PANEL (Current vs Original, Difference, vN)│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ CONVERSATION INTELLIGENCE STREAM (Slack/Linear/Stripe Style Feed)     │  │
│  │ ├─ System Event Pills (Buyer Joined, Inspection Requested)            │  │
│  │ ├─ User Chat Bubbles (Text, Attachments, Read Receipts)               │  │
│  │ ├─ Embedded Offer Cards (v1, v2 Counter, Accepted, Expired)           │  │
│  │ ├─ Embedded Inspection Cards (Scheduled, Rating, Summary)            │  │
│  │ └─ Embedded Document Cards (Title, Version, Verified Badge)           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Negotiation Aggregate    │ │ Universal Attachment      │ │ Universal │  │
│  │ (Immutable Git-Versions) │ │ Engine (Polymorphic Files)│ │ Comment   │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Transaction Aggregate    │ │ Universal Legal Audit Log │ │ Search    │  │
│  │ (Escrow/Payment/Dispute) │ │ Engine (Compliance)       │ │ Index     │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE & SECURE STORAGE LAYER (Supabase / PostgreSQL)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Negotiation Engine Architecture (Phase 3)

- **`NegotiationAggregate`** (`src/lib/deal-room/negotiation/types.ts`): Dedicated business aggregate separate from Conversation and Transaction. Manages commercial intent.
- **Git-Style Immutable Versioning (`NegotiationVersion`)**: Never overwrites an offer. Revision history builds version array (`v1` ➔ `v2` ➔ `v3` ➔ `v4`).
- **`NegotiationSummary`**: Pre-calculated summary metrics (`currentAmount`, `originalAskingPrice`, `differenceAmount`, `percentageDifference`, `totalOffersExchanged`, `expiresAt`).
- **`NegotiationService`** (`src/lib/deal-room/negotiation/service.ts`): Methods for `submitOffer()`, `counterOffer()`, `acceptOffer()`, `getSummary()`, audit logging, and embedding `offer_card` into stream.
- **`NegotiationSummaryPanel`** (`src/components/deal-room/negotiation-summary-panel.tsx`): Pinned Stripe/Linear-styled UI summary panel displaying live metrics and revision history dropdown.

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
│       │   ├── types.ts                 # NegotiationAggregate & NegotiationVersion
│       │   ├── service.ts               # NegotiationService & Repository
│       │   └── index.ts                 # Barrel exports
│       └── communications/
│           └── provider.ts              # Communication abstraction layer
└── components/
    └── deal-room/
        ├── deal-room-shell.tsx          # Reusable Deal Room UI Shell
        ├── conversation-workspace.tsx   # Production Conversation Workspace UI
        └── negotiation-summary-panel.tsx# Pinned Negotiation Summary UI
```

---

## 4. Final Phase 3 Certification

The Yike Structured Negotiation Engine is certified. Negotiations are dedicated, immutable, version-controlled, searchable aggregates rendering inside both the Conversation Stream and the Pinned Summary Panel. Future Voice Calls, Video Calls, and Escrow Payments will attach directly to accepted negotiations without architectural changes.
