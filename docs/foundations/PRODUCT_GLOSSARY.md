# Document 10 — Product Glossary

**Authority Level:** Controlled Vocabulary & Terminology Authority  
**Governance Scope:** Entire Yike Platform Codebase, Schema Field Names, API Payloads, UI Microcopy, Internal Documentation  
**Status:** Frozen Baseline (Yike V2 Phase 0)  

---

## 1. Mandate

This glossary defines the official, controlled vocabulary of Yike V2. Every engineer, product manager, UX designer, operations specialist, and executive MUST use these exact terms in code variable names, database column definitions, API routes, user-facing microcopy, and operational reports.

Synonyms, informal slang, or inconsistent terms (e.g. using "chat" interchangeably with "inquiry", or "seller rank" instead of "Trust Score") are strictly prohibited.

---

## 2. Controlled Vocabulary Terms

### A
- **Account Type**: The primary identity classification of a registered user (`individual`, `agent`, `dealer`, `landlord`, `company`, `developer`).
- **Active Listing**: A published listing that has passed moderation, is unexpired, and is visible in public discovery views.

### B
- **Business Verification**: The official verification process validating a business entity's registration with the Corporate Affairs Commission (CAC) and confirming its physical commercial office.
- **Buyer**: Any authenticated or guest user searching for properties or vehicles to purchase, rent, or lease.
- **Buyer Assistance**: An operational service where Yike staff guide buyers through asset selection, verification checks, and inspection scheduling.
- **Buyer Live Walkthrough**: A real-time 1-on-1 virtual video inspection conducted between buyer and seller using the platform.

### C
- **Company Verification**: Verification of a corporate developer or corporate real estate firm's legal standing and tax documentation.
- **Connect**: The explicit action or state where a buyer establishes contact with a seller via WhatsApp, Direct Phone Call, or Platform Chat.
- **Conversation**: An active, attributed messaging dialogue between a buyer and a seller regarding a specific listing.
- **CORE**: The entry-level subscription plan (Starter) providing 5 active listings and standard platform features.

### D
- **Deal**: A completed commercial transaction (sale, rent, lease) agreed upon between buyer and seller for a specific listing.
- **Developer**: An institutional user profile type representing real estate development companies managing multi-unit projects.

### F
- **Featured Listing**: A listing promoted to high-visibility discovery placements (homepage hero, top search results) via paid promotion or subscription boost credits.
- **Field Inspector**: A certified, independent property surveyor or automotive technician contracted by Yike to conduct on-site physical inspections.

### I
- **Identity Verification**: The verification of an individual user’s identity through National Identification Number (NIN), phone OTP, and biometric liveness checks.
- **Independent Inspection**: An on-site physical audit of a property or vehicle conducted by a certified Yike Field Inspector, resulting in an immutable 50-point report.

### L
- **Lead**: A logged inquiry event recorded when a buyer initiates contact (WhatsApp click, phone call, message, or scheduled viewing) with a seller.
- **Legal Partner**: An accredited legal practitioner or firm contracted by Yike to conduct official title searches and document verification.
- **Listing**: A structured record representing a property or vehicle offered for sale, rent, or lease on Yike.
- **Live Verification**: A geotagged, timestamped short video walkthrough uploaded by a seller to verify physical possession of an asset.

### M
- **Moderation**: The automated and manual process of auditing submitted listings for accuracy, policy compliance, and safety before publishing.

### P
- **PINNACLE**: The top-tier enterprise subscription plan for major developers and institutional estate managers offering unlimited project listings and custom CRM sync.
- **PRIME**: The high-growth subscription plan for established agencies and dealerships managing up to 100 active listings.
- **PRO**: The professional subscription plan designed for active individual agents and dealers managing up to 30 active listings.

### R
- **Review**: Verified rating (1–5 stars) and written feedback submitted by a buyer following an interaction or closed deal with a seller.

### T
- **Trust Badges**: Visual indicators (`Verified Individual`, `Verified Business`, `Yike Inspected`, `Legal Verified`) displayed on profiles and listings.
- **Trust Score**: A dynamic 0–100 score calculated by Yike’s Trust Engine measuring seller credibility, verification completeness, and operational reputation.
- **Trust Services**: On-demand paid verification services offered by Yike (Field Inspection, Legal Title Search, Fast-Track Moderation).

### V
- **Verification Officer**: A Yike operational team member responsible for auditing identity documents, CAC filings, and business addresses in `/lex`.
- **Viewing**: A scheduled physical or virtual appointment between a buyer and seller to inspect a property or vehicle.
