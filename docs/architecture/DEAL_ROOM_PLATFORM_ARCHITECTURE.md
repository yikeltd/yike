# Yike Deal Room Platform Architecture Specification (Phase 1)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & FOUNDATIONAL ARCHITECTURE IMPLEMENTED

---

## 1. Executive Architecture Proposal

A **Deal Room** is not a simple chat box or video window. It is a **secure, state-driven, multi-participant transaction workspace** where high-value African property and vehicle deals progress from initial inquiry to final payment and review.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ YIKE DEAL ROOM TRANSACTION PLATFORM                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ BUYER ]  [ SELLER ]  [ AGENT ]  [ FIELD INSPECTOR ]  [ LEGAL PARTNER ]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DEAL ROOM STATE ENGINE (Lead ➔ Inspection ➔ Offer ➔ Escrow ➔ Done)   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────┬───────────────────────────┬───────────┐  │
│  │ Pluggable Event Timeline    │ Provider-Agnostic Comms   │ Document  │  │
│  │ Bus (Audit Stream)          │ (Voice / Video / Presence)│ Vault     │  │
│  └─────────────────────────────┴───────────────────────────┴───────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE & SECURE STORAGE LAYER (Supabase / PostgreSQL)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Domain Model

- **`DealRoom`**: Root transaction aggregate bound to a specific listing (`vehicle`, `property`, `equipment`, `project`).
- **`DealParticipant`**: User assigned to a Deal Room with a specific role (`buyer`, `seller`, `agent`, `agency_manager`, `enterprise_staff`, `inspector`, `administrator`, `moderator`).
- **`TimelineEvent`**: Immutable event stream entry recording every transaction action.
- **`DealDocument`**: Versioned, permission-controlled file asset with verification states.
- **`DealOffer`**: Structured price proposal supporting counter-offers and expiration.
- **`DealInspection`**: Field verifier workflow aggregate with photo evidence and rating.

---

## 3. State Machine Engine

```
[lead_created]
       │
       ▼
[buyer_interested] ──► [seller_responded] ──► [negotiation]
                                                   │
                                                   ▼
[documents_shared] ◄── [inspection_completed] ◄── [inspection_scheduled] ◄── [inspection_requested]
       │
       ▼
  [offer_sent] ──► [offer_accepted] ──► [payment_pending] ──► [completed] ──► [archived]
```

Every transition is strictly validated by `canTransition(current, next)` in `src/lib/deal-room/state-machine.ts`, preventing illegal state leaps.

---

## 4. Permission Model

Granular Role-Based Access Control (`hasPermission(role, action)`) in `src/lib/deal-room/permissions.ts`:

| Role | Read Timeline | Send Msg | Make Offer | Accept Offer | Request Inspect | Upload Doc | Verify Doc | Start Calls | Cancel Deal |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Buyer** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Seller** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Agent** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Inspector**| ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Agency Mgr**| ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 5. Event Model

The `DealRoomEventBus` (`src/lib/deal-room/events.ts`) provides a pub/sub stream. Every transaction action publishes a `TimelineEvent` object:
- `room_created`, `participant_joined`, `message_sent`
- `inspection_requested`, `inspection_scheduled`, `inspection_completed`
- `offer_created`, `offer_countered`, `offer_accepted`
- `document_uploaded`, `document_verified`
- `voice_call_started`, `video_call_ended`, `payment_completed`, `deal_completed`

---

## 6. Directory Folder Structure

```text
src/
├── lib/
│   └── deal-room/
│       ├── types.ts                     # Core domain interfaces
│       ├── state-machine.ts             # Transaction state machine
│       ├── permissions.ts               # Role-based policy engine
│       ├── events.ts                    # Timeline & activity bus
│       ├── service.ts                   # Core Deal Room domain service
│       ├── communications/
│       │   └── provider.ts              # Provider-agnostic Voice/Video interface
│       ├── documents/
│       │   └── types.ts                 # Document vault schemas
│       ├── offers/
│       │   └── types.ts                 # Structured offer schemas
│       └── inspections/
│           └── types.ts                 # Inspection workflow schemas
└── components/
    └── deal-room/
        └── deal-room-shell.tsx          # Reusable Deal Room UI Shell
```

---

## 7. Database Proposal (PostgreSQL Schema)

```sql
-- 1. Deal Rooms Table
CREATE TABLE public.deal_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  listing_type TEXT NOT NULL,
  listing_title TEXT NOT NULL,
  listing_price NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'lead_created',
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Participants Table
CREATE TABLE public.deal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id UUID NOT NULL REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_room_id, user_id)
);

-- 3. Timeline Events Table
CREATE TABLE public.deal_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id UUID NOT NULL REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  actor_role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 8. API Proposal (REST Conventions)

- `POST /api/deal-rooms` — Initialize Deal Room for listing.
- `GET /api/deal-rooms/[id]` — Fetch Deal Room aggregate & current state.
- `GET /api/deal-rooms/[id]/timeline` — Paginated event stream.
- `POST /api/deal-rooms/[id]/transition` — Advance state machine (`nextStatus`).
- `POST /api/deal-rooms/[id]/offers` — Create structured offer / counter-offer.
- `POST /api/deal-rooms/[id]/inspections` — Request or schedule inspection.

---

## 9. Security & Data Isolation Review

- **Row Level Security (RLS)**: Users can only read/write Deal Rooms where their `auth.uid()` matches an active `deal_participants` record.
- **Audit Immutability**: `deal_timeline_events` append-only logs (no `UPDATE` or `DELETE` allowed).
- **Document Protection**: Signed short-lived Supabase Storage URLs enforcing participant authorization.

---

## 10. Performance & Scalability Review

- **Concurrency**: State updates execute via PostgreSQL atomic transactions (`SELECT FOR UPDATE`).
- **Realtime Strategy**: Supabase Realtime subscriptions filter strictly on `deal_room_id=eq.{id}`.
- **Websocket Memory Efficiency**: Clients connect only to active Deal Room channels.

---

## 11. Risk Assessment

- **Risk 1: Vendor Lock-in**: Mitigation achieved via `CommunicationProvider` abstraction in `provider.ts`. Agora can be swapped for WebRTC or Daily.co without changing Deal Room logic.
- **Risk 2: Out-of-Order Events**: Mitigation achieved via strict sequence numbers and immutable timestamp logs.

---

## 12. Recommended Implementation Order

- **Phase 1 (Complete)**: Foundational Architecture, State Machine, Permissions, Event Bus, Provider Abstraction, and UI Shell.
- **Phase 2**: Real-time Messaging & System-Initiated Threads.
- **Phase 3**: Document Center & Versioned Vault.
- **Phase 4**: Structured Offer Engine & Negotiation Flow.
- **Phase 5**: Field Inspection Workflow & Verifier Assignment.
- **Phase 6**: Agora Voice & Video Call Integration.
- **Phase 7**: BayRight Escrow Payment Integration.
- **Phase 8**: AI Deal Assistant & Summary Intelligence.
