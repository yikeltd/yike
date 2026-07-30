# Yike Transaction Workspace Platform Architecture Specification (Phase 1, 1.5, 2, 3 & Phase 4 Hardened)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & APPOINTMENT & SCHEDULING ENGINE IMPLEMENTED

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
│  │ ├─ Embedded Inspection & Appointment Cards (Scheduled, Address, Status)│  │
│  │ └─ Embedded Document Cards (Title, Version, Verified Badge)           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Appointment Aggregate    │ │ Universal Attachment      │ │ Universal │  │
│  │ (Milestone Scheduling)   │ │ Engine (Polymorphic Files)│ │ Comment   │  │
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

## 2. Appointment & Scheduling Engine Architecture (Phase 4)

- **`AppointmentAggregate`** (`src/lib/deal-room/appointments/types.ts`): Independent domain aggregate representing operational real-world milestones (`property_viewing`, `vehicle_inspection`, `test_drive`, `virtual_meeting`, `office_meeting`, `site_visit`, `document_signing`).
- **Reschedule Record Tracking (`RescheduleRecord`)**: Logs every reschedule attempt with previous time, new time, actor, and reason.
- **Provider-Agnostic Calendar Interface**: Exposes hooks for future Google Calendar, Apple Calendar, and Outlook sync without hardcoded dependencies.
- **`AppointmentService`** (`src/lib/deal-room/appointments/service.ts`): Methods for `requestAppointment()`, `confirmAppointment()`, `rescheduleAppointment()`, audit logging, and embedding `inspection_card` into stream.
- **`AppointmentCard`** (`src/components/deal-room/appointment-card.tsx`): Rich embedded UI card rendering appointment type, date, time, location, participant count, and action buttons.

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
│       │   ├── types.ts                 # AppointmentAggregate & AppointmentLocation
│       │   ├── service.ts               # AppointmentService & Repository
│       │   └── index.ts                 # Barrel exports
│       └── communications/
│           └── provider.ts              # Communication abstraction layer
└── components/
    └── deal-room/
        ├── deal-room-shell.tsx          # Reusable Deal Room UI Shell
        ├── conversation-workspace.tsx   # Production Conversation Workspace UI
        ├── negotiation-summary-panel.tsx# Pinned Negotiation Summary UI
        └── appointment-card.tsx         # Rich Embedded Appointment Card UI
```

---

## 4. Final Phase 4 Certification

The Yike Appointment & Scheduling Engine is certified. Viewings, field inspections, test drives, virtual meetings, and document signings are dedicated business milestones integrated into both the Transaction Workspace and Conversation Stream. Future Agora Voice and Video calls can attach directly to confirmed appointments without altering core architecture.
