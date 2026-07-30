# Yike Transaction Workspace Platform Architecture Specification (Phase 1 to Phase 12 Certified)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & ENTERPRISE WORKFLOW PLATFORM IMPLEMENTED

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
│  │ ├─ System Event Pills (Buyer Joined, Task Completed)                  │  │
│  │ ├─ User Chat Bubbles (Text, Attachments, Read Receipts)               │  │
│  │ ├─ Embedded Offer Cards (v1, v2 Counter, Accepted, Expired)           │  │
│  │ ├─ Embedded Call & Visual Cards (Video Sessions, Duration, Snapshots) │  │
│  │ └─ Embedded Verification Cards (Identity, Title, 94% Confidence)      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Workflow Aggregate       │ │ Universal Attachment      │ │ Universal │  │
│  │ (Task Engine & Approvals)│ │ Engine (Polymorphic Files)│ │ Comment   │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Settlement Aggregate     │ │ Universal Legal Audit Log │ │ Search    │  │
│  │ (Double-Entry Ledger)    │ │ Engine (Compliance)       │ │ Index     │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE & SECURE STORAGE LAYER (Supabase / PostgreSQL)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Enterprise Workflow & Collaboration Platform Architecture (Phase 12)

- **`WorkflowAggregate`** (`src/lib/deal-room/workflow/types.ts`): Domain aggregate managing business workflows (`transaction_workflow`, `property_sale`, `vehicle_sale`, `rental`, `inspection_workflow`, `legal_workflow`, `compliance_workflow`, `settlement_workflow`).
- **Cross-Domain `TransactionOrchestrator`** (`src/lib/deal-room/workflow/orchestrator.ts`): Event-driven orchestration layer that listens to domain timeline events (`inspection_completed`, `document_verified`, `payment_completed`) and advances task states without coupling domain services.
- **Configurable Task Engine (`WorkflowTask`)**: Reusable tasks with priority (`low`, `medium`, `high`, `urgent`), task types (`approval`, `review`, `upload_evidence`, `schedule_appointment`, `perform_execution`), dependencies, and role assignments.
- **Sequential & Multi-Person Approval Chain (`ApprovalChainStep`)**: Supports role-based approvals (Lawyer, Compliance, Finance, Agent).
- **`WorkflowCenterPanel`** (`src/components/deal-room/workflow-center-panel.tsx`): Linear/Notion-styled Kanban task board UI displaying progress percentage, task status, approval chain stepper, and decision logs.

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
│       │   ├── types.ts                 # WorkflowAggregate & WorkflowTask
│       │   ├── orchestrator.ts          # TransactionOrchestrator
│       │   ├── service.ts               # WorkflowService & Repository
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
        └── workflow-center-panel.tsx    # Linear-styled Workflow Task Center UI
```

---

## 4. Architectural Self-Audit (CTO Verification Questions)

1. **Did this phase introduce architectural debt?**
   - **No.** `TransactionOrchestrator` uses pure event-driven subscriptions (`dealRoomEvents`) to coordinate domains. Domains remain 100% decoupled from each other.
2. **What changes at 50 million users?**
   - The in-memory `WorkflowRepository` transitions to PostgreSQL database tables (`workflows`, `workflow_tasks`, `approval_chains`) with distributed message queues (e.g. RabbitMQ or Redis Streams) for `TransactionOrchestrator` event consumers.
3. **Which future phases became simpler?**
   - **Phase 13 (Transaction Completion & Dispute Resolution)**: Dispute holds and transaction sign-offs become task nodes inside `WorkflowAggregate`.
