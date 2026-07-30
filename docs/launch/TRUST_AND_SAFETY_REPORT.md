# YIKE TRUST & SAFETY ENGINE — PLATFORM ARCHITECTURE REPORT

> **Status:** OFFICIAL ARCHITECTURE & COMPLIANCE REPORT — CERTIFIED  
> **Authority:** Yike Trust & Safety Operations & Principal Architecture  
> **Audit Date:** 2026-07-30  
> **Target Standard:** Yike Platform Constitution & Enterprise Activation Program

---

## Executive Overview

The **Yike Trust & Safety Engine** is a 3-pass operational intelligence and enforcement system built directly into the Stankings Marketplace Platform.

Its primary objective is to maintain a fair, evidence-based marketplace that protects honest buyers and sellers while preventing scam attempts, fraud, and repeat offender evasion—all without exposing public fraud labels or creating unnecessary user friction.

---

## System Architecture Summary

```
                      +-----------------------------+
                      |     USER / BUYER REPORT     |
                      |   (Evidence & Category)     |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |     TRUST PROFILE & LEDGER  |
                      | (Risk Score & Audit Record) |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |     ENFORCEMENT ENGINE      |
                      | (Reversible & Auditable)    |
                      +--------------+--------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
+-----------------+         +-----------------+         +-----------------+
|  UNDER REVIEW   |         |   VISIBILITY    |         | SUSPENDED / BAN |
| (Freeze Ads/ID) |         |   RESTRICTED    |         | (Lock Auth &    |
+-----------------+         |(Silent Suppress)|         | Preserve Evidence|
                            +-----------------+         +-----------------+
```

---

## 1. Core Modules & Component Inventory

### 1.1 Trust Foundation (Pass 1)
- **`trust_profiles`**: Dynamic risk score (0–100), trust score (0–100), verification score (0–100), report count, confirmed violations, and status (`normal`, `under_review`, `restricted`, `suspended`, `banned`).
- **`trust_ledger`**: Permanent, immutable event stream recording every trust signal, report submission, and score delta.
- **`user_reports`**: Universal report intake supporting 13 categories (`scam`, `fraud`, `fake_listing`, `harassment`, `spam`, `payment_fraud`, etc.) with attached media/document evidence.
- **False Report Protection**: A single report **NEVER** automatically hides listings or suspends users. It strictly contributes to the risk score for human moderator review.

### 1.2 Enforcement & Repeat Offender Engine (Pass 2)
- **6-Tier Enforcement System**: Progressive restrictions from `Normal` -> `Warning` -> `Under Review` -> `Visibility Restricted` -> `Suspended` -> `Permanently Banned`.
- **Visibility Restriction**: Yike's primary protection mechanism. The restricted user's dashboard and profile function normally from their perspective, but their listings and profile are **silently suppressed from all public discovery surfaces** (Homepage, Search, Recommended, Category feeds, Ads).
- **Linked Account Engine (`linked_accounts`)**: Detects repeat offenders using multi-signal matching (verified phone reuse, normalized email reuse, government ID reuse, session patterns). High-confidence pairs (`>= 60%`) trigger risk score updates and moderator review.
- **Automated Promotion Pause**: Active boosts and ad campaigns automatically transition to `paused` when an account becomes restricted or suspended.

### 1.3 Operations Console, Automation & Appeals (Pass 3)
- **Staff Control Center**: Dedicated Trust & Safety navigation tabs (`Trust Center`, `Trust Queue`, `User Reports`, `Appeals`, `Linked Accounts`, `Verification`, `Security`, `Metrics`).
- **User Appeals Workflow (`trust_appeals`)**: Complete appeal submission API (`/api/trust/appeal/submit`) and Staff Decision API (`/api/admin/appeals`). Approving an appeal automatically restores account status and logs the resolution in the Trust Ledger.
- **Immutable Audit Trail (`trust_audit_logs`)**: Captures every moderation action with moderator ID, action type, timestamp, and audit notes.

---

## 2. Platform Compliance Matrix

| Requirement | Implementation Status | System Component |
| :--- | :---: | :--- |
| **Account Trust Profile** | ✓ Active | `trust_profiles` table & `getOrCreateTrustProfile()` |
| **Immutable Ledger** | ✓ Active | `trust_ledger` table & `recordTrustEvent()` |
| **Universal Report Intake** | ✓ Active | `user_reports` table & `/api/reports/submit` |
| **False Report Protection** | ✓ Enforced | Risk score weighting only; zero auto-bans |
| **Visibility Restrictions** | ✓ Active | `is_visibility_restricted` & public query filters |
| **Campaign Auto-Pause** | ✓ Active | `applyEnforcementAction()` auto-pause trigger |
| **Repeat Offender Detection**| ✓ Active | `detectLinkedAccounts()` multi-signal scanner |
| **Appeals Engine** | ✓ Active | `trust_appeals` table & `/api/admin/appeals` |
| **Audit Log Trail** | ✓ Active | `trust_audit_logs` table & `logTrustAudit()` |

---

## 3. Operational Guidelines for Moderators & Staff

1. **Evidence First**: Enforcement decisions must be backed by documented evidence (images, documents, verified conversation/transaction references).
2. **Reversibility**: All enforcement actions up to `Suspended` are fully reversible upon successful appeal. Permanent bans require elevated administrator authorization.
3. **Data Preservation**: Accounts, listings, messages, and evidence are **NEVER** deleted automatically, ensuring complete context for investigations and regulatory compliance.
