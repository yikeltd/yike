# Yike Transaction Workspace Platform Architecture Specification (Phase 1, 1.5 & Phase 2 Hardened)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & CONVERSATION INTELLIGENCE LAYER IMPLEMENTED

---

## 1. Executive Architecture Proposal & Core Concepts

A **Transaction Workspace** (UI label: **Deal Room**) is a secure, state-driven, multi-participant transaction workspace where high-value African property and vehicle deals progress from initial inquiry to final payment, escrow settlement, and review.

**Chat is NOT the product; Transaction is the product.** Messaging is simply one capability inside the **Conversation Intelligence Layer**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ YIKE TRANSACTION WORKSPACE PLATFORM                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ BUYER ]  [ SELLER ]  [ AGENT ]  [ FIELD INSPECTOR ]  [ LEGAL PARTNER ]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ CONVERSATION INTELLIGENCE STREAM (Slack/Linear/Stripe Style Feed)     │  │
│  │ ├─ System Event Pills (Buyer Joined, Inspection Requested)            │  │
│  │ ├─ User Chat Bubbles (Text, Attachments, Read Receipts)               │  │
│  │ ├─ Embedded Offer Cards (Submitted, Countered, Accepted)             │  │
│  │ ├─ Embedded Inspection Cards (Scheduled, Rating, Summary)            │  │
│  │ └─ Embedded Document Cards (Title, Version, Verified Badge)           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Transaction Aggregate    │ │ Universal Attachment      │ │ Universal │  │
│  │ (Escrow/Payment/Dispute) │ │ Engine (Polymorphic Files)│ │ Comment   │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Pluggable Event Timeline │ │ Universal Legal Audit Log │ │ Search    │  │
│  │ Bus (User Stream)        │ │ Engine (Compliance)       │ │ Index     │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE & SECURE STORAGE LAYER (Supabase / PostgreSQL)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Conversation Intelligence Layer Architecture (Phase 2)

- **`ConversationItem`** (`src/lib/deal-room/conversation/types.ts`): Polymorphic entry contract representing any stream entry:
  - `system_event`
  - `user_message`
  - `offer_card`
  - `inspection_card`
  - `document_card`
  - `verification_card`
  - `timeline_milestone`
  - `call_card` (future stub)
  - `payment_card` (future stub)
  - `task_card` (future stub)
- **`ConversationService`** (`src/lib/deal-room/conversation/service.ts`): Pure service boundary managing stream items, system auto-entries, card embeddings, pinned items, and automation hook emissions.
- **`ConversationWorkspace`** (`src/components/deal-room/conversation-workspace.tsx`): Production UI workspace component featuring a Slack/Linear/Stripe-styled feed, distinct system event pills, embedded transaction cards, sticky composer, and pinned item drawer.

---

## 3. Universal Ownership Model & Soft Delete Framework

Every aggregate and entity inherits from `BaseEntity` (`src/lib/deal-room/types.ts`):
- `createdBy`, `updatedBy`, `deletedBy`, `approvedBy`
- `createdAt`, `updatedAt`, `deletedAt`
- `version` (optimistic concurrency control)
- `status`: `"active" | "archived" | "deleted"`

---

## 4. Code Architecture & Folder Structure

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
│       ├── conversation/
│       │   ├── types.ts                 # ConversationItem & polymorphic stream types
│       │   ├── cards.ts                 # Embedded Card Payload schemas (Offer/Inspect/Doc)
│       │   ├── service.ts               # ConversationService & Repository
│       │   └── index.ts                 # Barrel exports
│       └── communications/
│           └── provider.ts              # Communication abstraction layer
└── components/
    └── deal-room/
        ├── deal-room-shell.tsx          # Reusable Deal Room UI Shell
        └── conversation-workspace.tsx   # Production Conversation Workspace UI
```

---

## 5. Final Phase 2 Certification

The Yike Transaction Workspace Conversation Intelligence Layer is certified. Messages, system events, structured offer cards, inspection cards, and document cards render as one continuous transaction stream. Future Voice, Video, AI, and Payment modules can plug in seamlessly by adding new conversation card renderers without altering the core architecture.
