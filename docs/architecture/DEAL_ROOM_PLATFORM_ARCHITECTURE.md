# Yike Transaction Workspace Platform Architecture Specification (Phase 1 to Phase 10 Certified)

> **Platform**: Yike.ng (Stankings Marketplace Platform)  
> **Author**: Antigravity Platform Architecture Team  
> **Status**: APPROVED & ENTERPRISE INTELLIGENCE PLATFORM IMPLEMENTED

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
│  │ ├─ System Event Pills (Buyer Joined, AI Summary Generated)           │  │
│  │ ├─ User Chat Bubbles (Text, Attachments, Read Receipts)               │  │
│  │ ├─ Embedded Offer Cards (v1, v2 Counter, Accepted, Expired)           │  │
│  │ ├─ Embedded Call & Visual Cards (Video Sessions, Duration, Snapshots) │  │
│  │ └─ Embedded Verification Cards (Identity, Title, 94% Confidence)      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ Intelligence Aggregate   │ │ Universal Attachment      │ │ Universal │  │
│  │ (Provider Adapters & AI) │ │ Engine (Polymorphic Files)│ │ Comment   │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌──────────────────────────┐ ┌───────────────────────────┐ ┌───────────┐  │
│  │ VisualSession Aggregate  │ │ Universal Legal Audit Log │ │ Search    │  │
│  │ (Remote Inspection Snaps)│ │ Engine (Compliance)       │ │ Index     │  │
│  └──────────────────────────┘ └───────────────────────────┘ └───────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE & SECURE STORAGE LAYER (Supabase / PostgreSQL)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Enterprise Intelligence Platform Architecture (Phase 10)

- **Provider Abstraction Architecture (`IntelligenceProvider`)**: Decouples AI reasoning from vendor APIs. Supports `GeminiIntelligenceAdapter` (Google Gemini 1.5 Pro), `OpenAIIntelligenceAdapter` (GPT-4o), and `MockIntelligenceAdapter`.
- **`IntelligenceRequestAggregate`** (`src/lib/deal-room/intelligence/types.ts`): Domain aggregate tracking AI capability requests (`reasoning`, `vision_analysis`, `ocr`, `summarization`, `classification`, `extraction`, `recommendation`, `translation`, `fraud_detection`, `risk_assessment`).
- **Structured Output Engine (`IntelligenceOutput`)**: Returns typed summaries, risk recommendations, confidence scores (0–100), execution time (ms), and token counts.
- **`ContextAssembler`**: Automatically compiles structured workspace context (Trust Scores, Negotiation versions, Evidence records, Execution checklists) for AI reasoning models.
- **Deterministic Trust Separation**: AI outputs produce recommendations only. Verification policies strictly govern actual Trust Score mutations.
- **`IntelligencePanel`** (`src/components/deal-room/intelligence-panel.tsx`): Enterprise AI Reasoning Center UI panel displaying recent analyses, provider metrics, confidence scores, and recommendations.

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
│       │   ├── types.ts                 # IntelligenceRequestAggregate & Output
│       │   ├── provider.ts              # IntelligenceProvider & Gemini/OpenAI Adapters
│       │   ├── service.ts               # IntelligenceService & ContextAssembler
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
        └── intelligence-panel.tsx       # Enterprise AI Reasoning Center UI
```

---

## 4. Architectural Self-Audit (CTO Verification Questions)

1. **Did this phase introduce architectural debt?**
   - **No.** Intelligence uses provider adapters (`IntelligenceProvider`) isolating Gemini and OpenAI APIs. AI models never mutate state directly; they feed recommendations into deterministic workspace domains.
2. **What changes at 50 million users?**
   - The in-memory `IntelligenceRepository` transitions to PostgreSQL database tables (`intelligence_requests`, `intelligence_outputs`) with Redis caching for repeated context prompts (`ContextAssembler`).
3. **Which future phases became simpler?**
   - **Phase 11 (Escrow & Payments)**: Fraud detection AI risk reports can be evaluated programmatically before disbursing escrow funds.
   - **Phase 13 (Dispute Resolution)**: AI summarization can synthesize 500+ messages and evidence logs into a 1-page arbitration summary for legal partners.
