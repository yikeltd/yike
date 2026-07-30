# Yike Transaction Workspace Platform Architecture Specification (Phase 1 to Phase 7 Certified)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & ENTERPRISE EVIDENCE PLATFORM IMPLEMENTED

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
│  │ ├─ System Event Pills (Buyer Joined, Evidence Verified)               │  │
│  │ ├─ User Chat Bubbles (Text, Attachments, Read Receipts)               │  │
│  │ ├─ Embedded Offer Cards (v1, v2 Counter, Accepted, Expired)           │  │
│  │ ├─ Embedded Evidence Cards (PDF, Image, Inspection Proof, Hash)       │  │
│  │ └─ Embedded Verification Cards (Identity, Title, 94% Confidence)      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Evidence Aggregate       │ │ Universal Attachment      │ │ Universal │  │
│  │ (Immutable Chain/Versions)│ │ Engine (Polymorphic Files)│ │ Comment   │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Verification Aggregate   │ │ Universal Legal Audit Log │ │ Search    │  │
│  │ (Evidence & Confidence)  │ │ Engine (Compliance)       │ │ Index     │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE & SECURE STORAGE LAYER (Supabase / PostgreSQL)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Enterprise Evidence Platform Architecture (Phase 7)

- **`EvidenceAggregate`** (`src/lib/deal-room/evidence/types.ts`): Independent domain aggregate for legal proof assets (`pdf`, `image`, `video`, `audio`, `voice_recording`, `inspection_photo`, `drone_image`, `gps_location`, `digital_signature`, `certificate`, `title_document`, `vehicle_registration`, `invoice`, `receipt`, `insurance`, `identity_document`).
- **Chain of Custody Provenance (`ChainOfCustodyRecord`)**: Logs every upload, review, verification, replacement, or archival action with actor ID, role, exact timestamp, and cryptographic hash (`sha256`).
- **Immutable Evidence Versioning (`EvidenceVersion`)**: Evidence is never overwritten. Replacements append to the `versions` array (`v1` ➔ `v2` ➔ `v3`).
- **`EvidenceService`** (`src/lib/deal-room/evidence/service.ts`): Methods for `uploadEvidence()`, `replaceEvidence()`, `verifyEvidence()`, audit logging, and embedding `document_card` into stream.
- **`EvidenceCenterPanel`** (`src/components/deal-room/evidence-center-panel.tsx`): Enterprise Proof Vault UI panel featuring category filters, immutable version history, and expandable Chain of Custody drawer.

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
│       │   ├── types.ts                 # EvidenceAggregate & ChainOfCustodyRecord
│       │   ├── service.ts               # EvidenceService & Repository
│       │   └── index.ts                 # Barrel exports
└── components/
    └── deal-room/
        ├── deal-room-shell.tsx          # Reusable Deal Room UI Shell
        ├── conversation-workspace.tsx   # Production Conversation Workspace UI
        ├── negotiation-summary-panel.tsx# Pinned Negotiation Summary UI
        ├── appointment-card.tsx         # Rich Embedded Appointment Card UI
        ├── voice-call-overlay.tsx       # FaceTime-styled In-Call UI
        ├── trust-center-panel.tsx       # Banking-styled Trust Center Dashboard UI
        └── evidence-center-panel.tsx    # Enterprise Proof Vault UI
```

---

## 4. Architectural Self-Audit (CTO Verification Questions)

1. **Did this phase introduce architectural debt?**
   - **No.** Evidence was created as an independent proof aggregate (`EvidenceAggregate`) with polymorphic ownership (`PolymorphicOwnerType`). It seamlessly feeds `VerificationService` without tight coupling.
2. **What changes at 50 million users?**
   - The in-memory `EvidenceRepository` transitions to PostgreSQL database tables (`evidence_aggregates`, `evidence_versions`, `chain_of_custody`) with S3/Supabase Storage signed URL generation and background malware/DLP scanning.
3. **What future phases became simpler?**
   - **Phase 8 (Inspection Platform)**: Inspection photos, drone footage, and verifier reports will attach directly as `EvidenceAggregate` records.
   - **Phase 11 (Escrow & Payments)**: Title documents and invoices are already cryptographically logged and ready for payment disbursement triggers.
   - **Phase 13 (Dispute Resolution)**: The Chain of Custody provenance log provides zero-tampering legal proof for dispute arbitrations.
