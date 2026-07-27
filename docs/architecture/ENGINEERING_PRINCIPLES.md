# Document 08 — Engineering Principles

**Technical Authority:** Code Construction & Engineering Discipline Standard  
**Governance Scope:** Codebase Structure, Design Patterns, Refactoring Rules, System Hygiene  
**Status:** Frozen Architecture Baseline (Yike V2 Phase 0.75)  

---

## 1. The Engineering Mandate

These 8 Engineering Principles govern all current and future software construction inside the Yike codebase. Any code pull request or architectural modification that violates these principles **SHALL BE REJECTED** during code review.

---

## 2. The 8 Core Engineering Principles

---

### Principle 1: Single Responsibility (SRP)
Each module, component, function, and platform service MUST have **exactly one reason to change**.
- **Violation**: A React component that fetches data from Supabase, formats prices, validates user NIN, and renders UI.
- **Standard**: Separate UI components from data fetching hooks, domain service logic, and pure utility formatting functions.

---

### Principle 2: Zero Duplicated Business Logic (DRY & SSOT)
Business logic MUST be defined in **exactly one authoritative service layer**.
- **Violation**: Re-implementing subscription limit checks separately in 3 different API routes and 2 UI components.
- **Standard**: Encapsulate active listing limit checks in `SubscriptionService.canPublishListing()`; invoke that single method everywhere.

---

### Principle 3: Composition Over Coupling
Prefer composable, decoupled modules over deep object-oriented inheritance hierarchies or tightly bound component trees.
- **Violation**: Creating a giant `BaseListingComponent` with 50 props inherited across properties, vehicles, and shortlets.
- **Standard**: Build small, focused atomic components (`ListingHeader`, `PriceDisplay`, `TrustBadgeBar`) and compose them per layout.

---

### Principle 4: Strict Platform Ownership
Data models and tables are owned by **exactly one domain platform**.
- **Violation**: Importing the `trust_scores` database client directly inside a `Discovery` search route to update a seller's score.
- **Standard**: Invoke `TrustService.updateTrustScore()` or emit a `ReviewSubmitted` event.

---

### Principle 5: Small Interfaces & Small Contracts
Define lean, explicit TypeScript interfaces and schema contracts.
- **Violation**: Passing a 1,000-line global `UserContext` object into a tiny button component that only needs `userId`.
- **Standard**: Pass only the exact required primitives or lean typed interfaces (`{ userId: string }`).

---

### Principle 6: Clear Contracts & Explicit Types
Never use `any`, implicit untyped objects, or unvalidated API payloads.
- **Violation**: Receiving an unvalidated `req.json()` in an API route and dereferencing properties without type safety.
- **Standard**: Validate all external inputs via explicit schema validators (e.g. Zod) before executing service logic.

---

### Principle 7: Event-Driven Cross-Domain Integration
Cross-platform side effects MUST occur via **Domain Events**, not direct synchronous cross-service calls.
- **Violation**: `DiscoveryService` calling `NotificationService` and `AnalyticsService` directly inside `publishListing()`.
- **Standard**: `DiscoveryService` emits `ListingPublished`. `NotificationService` and `AnalyticsService` subscribe to the event independently.

---

### Principle 8: Future Scalability & Performance Standard
Every database query, API route, and UI component MUST be written with production scalability in mind.
- **N+1 Query Prevention**: Batch and join database queries; never execute SQL queries inside loops.
- **Cumulative Layout Shift (CLS = 0)**: Pre-allocate image and map container dimensions.
- **Instant Response SLA**: API endpoints must resolve in $< 100\text{ms}$ under standard loads.
