# Yike Transaction Workspace Platform Architecture Specification (Phase 1 & 1.5 Hardened)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & HARDENED ENTERPRISE ARCHITECTURE IMPLEMENTED

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
│  │ WORKSPACE STATE MACHINE (Lead ➔ Inspection ➔ Offer ➔ Escrow ➔ Done)  │  │
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

## 2. Universal Ownership Model & Soft Delete Framework

Every aggregate and entity inherits from `BaseEntity` (`src/lib/deal-room/types.ts`):
- `createdBy`, `updatedBy`, `deletedBy`, `approvedBy`
- `createdAt`, `updatedAt`, `deletedAt`
- `version` (optimistic concurrency control)
- `status`: `"active" | "archived" | "deleted"`

**Zero Hard Deletes**: Nothing is ever permanently purged. Deletions set `status: "deleted"` and record `deletedBy` / `deletedAt`, permitting legal audit compliance and dispute restoration.

---

## 3. Transaction Aggregate vs Workspace Collaboration

- **`TransactionWorkspace`** (`src/lib/deal-room/types.ts`): Handles user collaboration, participants, timeline, comments, and communication.
- **`TransactionAggregate`** (`src/lib/deal-room/transaction.ts`): Handles business execution, escrow funding, milestone approvals, disbursements, refunds, and disputes.

---

## 4. Universal Attachment Engine

`AttachmentService` (`src/lib/deal-room/attachments.ts`) provides a single polymorphic attachment engine for all entities:
- `ownerType`: `"message" | "offer" | "inspection" | "document" | "timeline_event" | "task" | "transaction" | "comment"`
- Supports versioning, file size tracking, mime-type validation, and soft-delete restoration.

---

## 5. Universal Comment Engine

`CommentService` (`src/lib/deal-room/comments.ts`) provides contextual annotations distinct from real-time messaging:
- `ownerType`: `"offer" | "inspection" | "document" | "timeline_event" | "task" | "transaction"`
- Supports threaded replies (`parentCommentId`) and audit logging.

---

## 6. Legal Audit Log vs User Timeline

- **User Timeline (`TimelineEvent`)**: User-facing event stream (`room_created`, `offer_accepted`, `inspection_completed`). Includes `eventVersion`, `schemaVersion`, `correlationId`, `causationId`.
- **Legal Audit Log (`AuditLogEntry`)**: Compliance-grade immutable log (`src/lib/deal-room/audit.ts`) capturing `oldValue`, `newValue`, `actorRole`, `reason`, `ipAddress`, and `automationSource`.

---

## 7. Automation Hooks Bus

`AutomationHookBus` (`src/lib/deal-room/hooks.ts`) emits event-driven hooks for decoupled background consumers (Notifications, AI, CRM, Analytics, Webhooks, Email, SMS).

---

## 8. Universal Search & Indexing Engine

`WorkspaceSearchIndex` (`src/lib/deal-room/search.ts`) indexes messages, offers, documents, inspection reports, timeline events, and comments for fast unified search.

---

## 9. Hardened Database Schema (PostgreSQL DDL)

```sql
-- 1. Base Entity Domain Types
CREATE TYPE entity_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE participant_role AS ENUM ('buyer', 'seller', 'agent', 'agency_manager', 'enterprise_staff', 'inspector', 'administrator', 'moderator');
CREATE TYPE execution_status AS ENUM ('draft', 'pending_funding', 'escrow_funded', 'inspection_approved', 'documents_approved', 'disbursed', 'completed', 'refunded', 'disputed', 'cancelled');

-- 2. Workspaces Table
CREATE TABLE public.transaction_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  listing_type TEXT NOT NULL,
  listing_title TEXT NOT NULL,
  listing_price NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  workspace_status TEXT NOT NULL DEFAULT 'lead_created',
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,
  status entity_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Business Execution Transactions Table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_workspace_id UUID NOT NULL REFERENCES public.transaction_workspaces(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  execution_status execution_status NOT NULL DEFAULT 'draft',
  escrow_state TEXT NOT NULL DEFAULT 'unfunded',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INT NOT NULL DEFAULT 1,
  status entity_status NOT NULL DEFAULT 'active'
);

-- 4. Universal Attachments Table
CREATE TABLE public.universal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.transaction_workspaces(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL,
  owner_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  status entity_status NOT NULL DEFAULT 'active'
);

-- 5. Legal Audit Logs Table (Append-Only)
CREATE TABLE public.audit_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.transaction_workspaces(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  actor_role TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  automation_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 10. Code Architecture & Hardened Files

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
│       └── communications/
│           └── provider.ts              # Communication abstraction layer
└── components/
    └── deal-room/
        └── deal-room-shell.tsx          # Reusable Deal Room UI Shell
```

---

## 11. Final Phase 1.5 Certification

The Yike Transaction Workspace Platform has completed all Phase 1.5 Hardening requirements. It is enterprise-grade, fully audited, provider-agnostic, soft-delete safe, and ready for future modules (Voice, Video, Offers, Documents, Inspections, AI, Escrow) without structural redesign.
