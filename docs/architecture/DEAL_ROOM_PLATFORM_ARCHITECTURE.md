# Yike Transaction Workspace Platform Architecture Specification (Phase 1 to Phase 9 Certified)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & VISUAL COLLABORATION PLATFORM IMPLEMENTED

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
│  │ ├─ System Event Pills (Buyer Joined, Visual Session Started)          │  │
│  │ ├─ User Chat Bubbles (Text, Attachments, Read Receipts)               │  │
│  │ ├─ Embedded Offer Cards (v1, v2 Counter, Accepted, Expired)           │  │
│  │ ├─ Embedded Call & Visual Cards (Video Sessions, Duration, Snapshots) │  │
│  │ └─ Embedded Verification Cards (Identity, Title, 94% Confidence)      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ VisualSession Aggregate  │ │ Universal Attachment      │ │ Universal │  │
│  │ (Remote Inspection Snaps)│ │ Engine (Polymorphic Files)│ │ Comment   │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Evidence Aggregate       │ │ Universal Legal Audit Log │ │ Search    │  │
│  │ (Immutable Chain/Versions)│ │ Engine (Compliance)       │ │ Index     │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE & SECURE STORAGE LAYER (Supabase / PostgreSQL)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Visual Collaboration Platform Architecture (Phase 9)

- **`VisualSessionAggregate`** (`src/lib/deal-room/visual/types.ts`): Domain aggregate managing real-time visual collaboration (`video_call`, `remote_inspection`, `screen_share`, `presentation`, `evidence_capture`, `multi_camera`).
- **Live Evidence Snapshot Capture**: Snapshots taken during live video sessions auto-upload directly to `EvidenceService.uploadEvidence()` as immutable inspection photo evidence attached to the workspace.
- **Provider-Agnostic Media Adapter**: Plugs directly into `CommunicationProvider` (`AgoraCommunicationAdapter`), maintaining zero vendor lock-in.
- **`VisualSessionService`** (`src/lib/deal-room/visual/service.ts`): Methods for `startVisualSession()`, `captureSnapshot()`, `endVisualSession()`, audit logging, and embedding `call_card` into stream.
- **`VisualCollaborationOverlay`** (`src/components/deal-room/visual-collaboration-overlay.tsx`): Premium responsive UI overlay with video stage, floating controls, snapshot trigger button, and Picture-in-Picture window.

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
│       │   ├── types.ts                 # VisualSessionAggregate & SnapshotRecord
│       │   ├── service.ts               # VisualSessionService & Repository
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
        └── visual-collaboration-overlay.tsx # Responsive Visual Overlay UI
```

---

## 4. Architectural Self-Audit (CTO Verification Questions)

1. **Did this phase introduce architectural debt?**
   - **No.** Visual Collaboration extends the existing `CommunicationProvider` adapter pattern cleanly. Live snapshots plug directly into `EvidenceService.uploadEvidence()` without duplicating file or storage logic.
2. **What changes at 50 million users?**
   - The in-memory `VisualSessionRepository` transitions to PostgreSQL database tables (`visual_sessions`, `session_snapshots`) with WebRTC Selective Forwarding Unit (SFU) scaling (e.g. LiveKit or Agora Cloud Recording).
3. **Which future phases became simpler?**
   - **Phase 10 (AI Intelligence Platform)**: Live video frames and snapshots can be fed directly to Gemini vision models for automated damage detection or land boundaries.
   - **Phase 13 (Dispute Resolution)**: Visual session recordings and instant snapshots serve as timestamped evidence in dispute arbitrations.
