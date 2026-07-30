# Yike Transaction Workspace Platform Architecture Specification (Phase 1 to Phase 13 Certified)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & TRANSACTION LIFECYCLE PLATFORM IMPLEMENTED

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
│  │ TRANSACTION COMPLETION CENTER (Asset Acceptance, Reviews & Disputes)  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ WORKFLOW & ORCHESTRATION CENTER (Tasks, Approval Chains & Decisions)   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ SETTLEMENT CENTER (Double-Entry Ledger / Multi-Party Escrow Payouts)  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ INTELLIGENCE CENTER (Provider Adapters: Gemini 1.5 Pro / Risk / AI)   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ VISUAL COLLABORATION STAGE (HD Live Video / Remote Inspection / Snaps) │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ OPERATIONAL EXECUTION CENTER (Field Worksheets, Personnel & Checklists)│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ ENTERPRISE EVIDENCE VAULT (Cryptographic Chain of Custody / Proof)    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
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
│  │ ├─ System Event Pills (Buyer Joined, Review Published, Deal Accepted) │  │
│  │ ├─ User Chat Bubbles (Text, Attachments, Read Receipts)               │  │
│  │ ├─ Embedded Offer Cards (v1, v2 Counter, Accepted, Expired)           │  │
│  │ ├─ Embedded Call & Visual Cards (Video Sessions, Duration, Snapshots) │  │
│  │ └─ Embedded Verification Cards (Identity, Title, 94% Confidence)      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ TransactionLifecycle     │ │ Universal Attachment      │ │ Universal │  │
│  │ Aggregate (Post-Deal)    │ │ Engine (Polymorphic Files)│ │ Comment   │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Workflow Aggregate       │ │ Universal Legal Audit Log │ │ Search    │  │
│  │ (Task Engine & Approvals)│ │ Engine (Compliance)       │ │ Index     │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE & SECURE STORAGE LAYER (Supabase / PostgreSQL)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Transaction Lifecycle Platform Architecture (Phase 13)

- **`TransactionLifecycleAggregate`** (`src/lib/deal-room/lifecycle/types.ts`): Independent domain aggregate governing the post-settlement transaction lifecycle (`pending_completion`, `awaiting_acceptance`, `accepted`, `completed`, `under_warranty`, `disputed`, `refund_pending`, `refunded`, `cancelled`, `archived`).
- **Acceptance Flow Engine (`AcceptanceService`)**: Coordinates dual-party delivery acceptance (Buyer & Seller) before marking deals completed and releasing escrow.
- **Immutable Review Engine (`ReviewRecord` & `ReviewVersion`)**: Reviews are immutable upon publication. Edits append to `versions` array (`v1` ➔ `v2`).
- **Separation of Trust & Reputation (`ReputationService`)**:
  - **Trust Score**: Deterministic factual verification metrics (KYC, Title Deeds, Field Inspections).
  - **Reputation Score**: Community experience metrics (review history, transaction volume, reviewer credibility).
- **Dispute & Warranty Engine (`DisputeRecord` & `WarrantyRecord`)**: Handles dispute freezes, evidence references, mediation, and warranty claims.
- **`LifecycleCenterPanel`** (`src/components/deal-room/lifecycle-center-panel.tsx`): Enterprise Completion & Dispute Dashboard UI.

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
│       ├── evidence/                    # Phase 7 Enterprise Evidence Platform
│       ├── execution/                   # Phase 8 Enterprise Execution Platform
│       ├── visual/                      # Phase 9 Visual Collaboration Platform
│       ├── intelligence/                # Phase 10 Enterprise Intelligence Platform
│       ├── settlement/                  # Phase 11 Enterprise Settlement Platform
│       ├── workflow/                    # Phase 12 Enterprise Workflow Platform
│       ├── lifecycle/                   # Phase 13 Transaction Lifecycle Platform
│       │   ├── types.ts                 # TransactionLifecycleAggregate & DisputeRecord
│       │   ├── service.ts               # TransactionLifecycleService & Engines
│       │   └── index.ts                 # Barrel exports
└── components/
    └── deal-room/
        ├── deal-room-shell.tsx          # Reusable Deal Room UI Shell
        ├── conversation-workspace.tsx   # Production Conversation Workspace UI
        ├── negotiation-summary-panel.tsx# Pinned Negotiation Summary UI
        ├── appointment-card.tsx         # Rich Embedded Appointment Card UI
        ├── voice-call-overlay.tsx       # FaceTime-styled In-Call UI
        ├── trust-center-panel.tsx       # Banking-styled Trust Center Dashboard UI
        ├── evidence-center-panel.tsx    # Enterprise Proof Vault UI
        ├── execution-center-panel.tsx   # Operational Execution Work Center UI
        ├── visual-collaboration-overlay.tsx # Responsive Visual Overlay UI
        ├── intelligence-panel.tsx       # Enterprise AI Reasoning Center UI
        ├── settlement-center-panel.tsx  # Banking-styled Settlement Center Ledger UI
        ├── workflow-center-panel.tsx    # Linear-styled Workflow Task Center UI
        └── lifecycle-center-panel.tsx   # Completion & Dispute Dashboard UI
```

---

## 4. Architectural Self-Audit (CTO Verification Questions)

1. **Did this phase introduce architectural debt?**
   - **No.** `TransactionLifecycleAggregate` consumes previous domains (Settlement, Evidence, Workflow) through event orchestration without tight coupling or modifying past models.
2. **What changes at 50 million users?**
   - In-memory lifecycle repositories transition to PostgreSQL database tables (`transaction_lifecycles`, `review_records`, `dispute_records`, `warranty_records`) with cold-storage S3 data archiving for transactions older than 7 years.
3. **What is still missing before production?**
   - Production readiness hardening: PostgreSQL persistence migration, distributed event queues, load testing, and security penetration testing (Phase 14).
