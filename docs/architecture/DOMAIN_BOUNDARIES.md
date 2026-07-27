# Document 02 — Domain Boundaries & Governance

**Technical Authority:** Boundary Enforcement & Anti-Overlap Governance  
**Governance Scope:** Module Boundaries, Owned Capabilities, Inter-Platform Communication  
**Status:** Frozen Architecture Baseline (Yike V2 Phase 0.75)  

---

## 1. Boundary Governance Mandate

To prevent architectural entropy, duplicate business logic, and tight coupling, every domain platform MUST strictly respect its domain boundary.

- **Rule 1**: A platform owns its domain data and business logic exclusively. No external platform may write directly to another platform's data tables.
- **Rule 2**: Cross-platform communication MUST occur via explicit Public Contracts or Domain Events.
- **Rule 3**: If a data entity or workflow feels like it belongs in two platforms, it MUST be split into distinct owned models connected via explicit IDs.

---

## 2. Platform Boundary Matrix

---

### A. Identity Platform
- **WHAT IT OWNS**: User authentication, passwords/PINs, user profile metadata, account roles (`agent`, `dealer`, etc.).
- **WHAT IT DOES NOT OWN**: Trust scores (owned by Trust Platform), seller subscription status (owned by Revenue Platform), active listings (owned by Discovery Platform).
- **Communication Protocol**: Synchronous service calls (`getUserProfile()`).

---

### B. Discovery Platform
- **WHAT IT OWNS**: Listing specs, property/vehicle attributes, listing status (`draft`, `pending`, `active`, `expired`, `sold`).
- **WHAT IT DOES NOT OWN**: Physical inspection reports (owned by Trust Platform), seller subscription limits (owned by Revenue Platform), lead counts (owned by Seller Success Platform).
- **Communication Protocol**: Synchronous queries (`getListing()`) and Domain Events (`ListingPublished`).

---

### C. Communication Platform
- **WHAT IT OWNS**: Messages, WhatsApp connect links, direct call logs, scheduled viewing appointments.
- **WHAT IT DOES NOT OWN**: Listing specs (owned by Discovery Platform), user phone numbers (owned by Identity Platform), seller lead analytics (owned by Analytics Platform).
- **Communication Protocol**: Domain Events (`ConversationStarted`, `ViewingScheduled`).

---

### D. Trust Platform
- **WHAT IT OWNS**: NIN checks, CAC filings, field inspection reports, Trust Badges, dynamic Trust Score calculations.
- **WHAT IT DOES NOT OWN**: Platform user profiles (owned by Identity Platform), physical payment gateways (owned by Commerce Platform).
- **Communication Protocol**: Asynchronous Domain Events (`TrustScoreUpdated`, `InspectionCompleted`).

---

### E. Commerce Platform
- **WHAT IT OWNS**: Checkout sessions, Paystack/SafeHaven webhooks, escrow account balances, payment receipts.
- **WHAT IT DOES NOT OWN**: Subscription tier rules (owned by Revenue Platform), physical inspection dispatch (owned by Trust Platform).
- **Communication Protocol**: Webhooks and Domain Events (`PaymentCompleted`).

---

### F. Seller Success Platform
- **WHAT IT OWNS**: Seller Command Center metrics, lead status tracking (`New`, `Contacted`, `Viewing Set`, `Closed`), team seat allocation.
- **WHAT IT DOES NOT OWN**: User authentication (owned by Identity Platform), raw messaging logic (owned by Communication Platform).
- **Communication Protocol**: Event listener consuming `LeadCreated` events.

---

### G. Revenue Platform
- **WHAT IT OWNS**: Subscription tier definitions (`CORE`, `PRO`, `PRIME`, `PINNACLE`), billing duration rules, promotion boost rules.
- **WHAT IT DOES NOT OWN**: Payment gateway webhooks (owned by Commerce Platform), active listing limits enforcement execution (owned by Discovery Platform via rule checks).
- **Communication Protocol**: Synchronous service call (`getActiveSubscription()`).

---

### H. Operations Platform (`/lex`)
- **WHAT IT OWNS**: Admin queues, moderation review workflows, verifier assignments, support escalation tickets.
- **WHAT IT DOES NOT OWN**: End-user public views, primary payment processing.
- **Communication Protocol**: Direct administrative service invocation with audit logging.
