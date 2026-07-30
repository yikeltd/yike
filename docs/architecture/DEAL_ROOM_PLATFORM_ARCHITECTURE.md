# Yike Transaction Workspace Platform Architecture Specification (Phase 1 to Phase 5 Certified)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & ENTERPRISE COMMUNICATION PLATFORM IMPLEMENTED

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
│  │ ├─ System Event Pills (Buyer Joined, Inspection Requested)            │  │
│  │ ├─ User Chat Bubbles (Text, Attachments, Read Receipts)               │  │
│  │ ├─ Embedded Offer Cards (v1, v2 Counter, Accepted, Expired)           │  │
│  │ ├─ Embedded Voice Call Cards (Requested, Connected, Duration)        │  │
│  │ └─ Embedded Document Cards (Title, Version, Verified Badge)           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Communication Aggregate  │ │ Universal Attachment      │ │ Universal │  │
│  │ (Provider Adapter Engine)│ │ Engine (Polymorphic Files)│ │ Comment   │  │
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

## 2. Enterprise Communication Platform Architecture (Phase 5)

- **Provider Abstraction Architecture (`CommunicationProvider`)**: The Transaction Workspace is **never coupled to Agora**. Agora is implemented strictly as a provider adapter (`AgoraCommunicationAdapter` in `src/lib/deal-room/communications/provider.ts`), permitting zero-friction swapping for LiveKit, Daily.co, Twilio, or WebRTC drivers.
- **`CommunicationAggregate`** (`src/lib/deal-room/communications/types.ts`): Domain aggregate managing real-time session status (`requested`, `ringing`, `connected`, `completed`, `failed`), channel tokens, media state, presence, and duration tracking.
- **`CommunicationService`** (`src/lib/deal-room/communications/service.ts`): Methods for `initiateVoiceSession()`, `connectVoiceSession()`, `endVoiceSession()`, audit logging, and embedding `call_card` into stream.
- **`VoiceCallOverlay`** (`src/components/deal-room/voice-call-overlay.tsx`): Premium FaceTime-meets-Stripe styled dark mode in-call UI with live call timer, connection quality indicator, mute controls, speaker controls, and disabled video placeholders for Phase 6.

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
│       │   ├── types.ts                 # CommunicationAggregate & MediaState
│       │   ├── provider.ts              # CommunicationProvider & AgoraCommunicationAdapter
│       │   ├── service.ts               # CommunicationService & Repository
│       │   └── index.ts                 # Barrel exports
└── components/
    └── deal-room/
        ├── deal-room-shell.tsx          # Reusable Deal Room UI Shell
        ├── conversation-workspace.tsx   # Production Conversation Workspace UI
        ├── negotiation-summary-panel.tsx# Pinned Negotiation Summary UI
        ├── appointment-card.tsx         # Rich Embedded Appointment Card UI
        └── voice-call-overlay.tsx       # FaceTime-styled In-Call UI
```

---

## 4. Final Phase 5 Certification

The Yike Enterprise Communication Platform (Voice Foundation) is certified. Voice calling operates as a provider-agnostic, scheduled business session inside the Transaction Workspace. Agora is isolated inside `AgoraCommunicationAdapter`. Future Video calling (Phase 6) requires only extending media session types without architectural changes.
