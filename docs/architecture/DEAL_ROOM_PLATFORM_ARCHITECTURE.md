# Yike Transaction Workspace Platform Architecture Specification (Phase 1 to Phase 11 Certified)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & ENTERPRISE SETTLEMENT PLATFORM IMPLEMENTED

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
│  │ ├─ System Event Pills (Buyer Joined, Escrow Released)                 │  │
│  │ ├─ User Chat Bubbles (Text, Attachments, Read Receipts)               │  │
│  │ ├─ Embedded Offer Cards (v1, v2 Counter, Accepted, Expired)           │  │
│  │ ├─ Embedded Call & Visual Cards (Video Sessions, Duration, Snapshots) │  │
│  │ └─ Embedded Verification Cards (Identity, Title, 94% Confidence)      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Settlement Aggregate     │ │ Universal Attachment      │ │ Universal │  │
│  │ (Double-Entry Ledger)    │ │ Engine (Polymorphic Files)│ │ Comment   │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Intelligence Aggregate   │ │ Universal Legal Audit Log │ │ Search    │  │
│  │ (Provider Adapters & AI) │ │ Engine (Compliance)       │ │ Index     │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE & SECURE STORAGE LAYER (Supabase / PostgreSQL)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Enterprise Settlement Platform Architecture (Phase 11)

- **`SettlementAggregate`** (`src/lib/deal-room/settlement/types.ts`): Independent domain aggregate for financial movements (`escrow`, `marketplace_payment`, `wallet_transfer`, `refund`, `partial_refund`, `milestone_release`, `inspection_fee`, `legal_fee`, `commission`, `platform_fee`, `tax`, `bank_transfer`).
- **Double-Entry Ledger Engine (`LedgerService` & `LedgerEntry`)**: Enforces strict financial accounting where `Sum(Debits) === Sum(Credits)` with derived account balances.
- **PSP Provider Abstraction (`SettlementProvider`)**: Decouples payment execution from payment gateways. Supports `PaystackSettlementAdapter`, `KorapaySettlementAdapter`, and `MockSettlementAdapter`.
- **Deterministic Settlement Rule Engine (`SettlementRuleEngine`)**: Evaluates Trust Scores (>= 65), field execution completion, evidence verification, and AI risk reports before disbursing funds.
- **`SettlementCenterPanel`** (`src/components/deal-room/settlement-center-panel.tsx`): Banking-styled ledger dashboard UI displaying total escrow balance, multi-party split allocations, rule checklist, and ledger audit timeline.

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
│       │   ├── types.ts                 # SettlementAggregate & LedgerEntry
│       │   ├── provider.ts              # SettlementProvider & Paystack Adapters
│       │   ├── ledger.ts                # Double-Entry Ledger Engine
│       │   ├── service.ts               # SettlementService & RuleEngine
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
        └── settlement-center-panel.tsx  # Banking-styled Settlement Center Ledger UI
```

---

## 4. Architectural Self-Audit (CTO Verification Questions)

1. **Did this phase introduce architectural debt?**
   - **No.** Settlement is an independent aggregate (`SettlementAggregate`) with double-entry accounting. Money movements use provider adapters (`SettlementProvider`) without direct dependency on PSP SDKs.
2. **What changes at 50 million users?**
   - The in-memory `SettlementRepository` and `LedgerService` transition to PostgreSQL database tables (`settlements`, `ledger_entries`, `settlement_splits`) with ACID transactional locks, webhook idempotency keys, and automated bank reconciliation jobs.
3. **Which future phases became simpler?**
   - **Phase 12 (Enterprise Collaboration)**: Multi-party splits (Agents, Lawyers, Inspectors, Platform) are already calculated and logged.
   - **Phase 13 (Dispute Resolution)**: Held escrow funds can be programmatically paused or partially refunded via `SettlementService.processRefund()`.
