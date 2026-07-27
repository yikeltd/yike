# Document 05 — Data Ownership & Single Source of Truth (SSOT)

**Technical Authority:** Database Architecture & Data Ownership Specification  
**Governance Scope:** Database Schemas, Table Ownership, Single Source of Truth (SSOT), Anti-Duplication  
**Status:** Frozen Architecture Baseline (Yike V2 Phase 0.75)  

---

## 1. Single Source of Truth (SSOT) Mandate

To eliminate data corruption, race conditions, and conflicting metric definitions:

- **Rule 1**: Every database table and entity has **EXACTLY ONE owning platform**.
- **Rule 2**: No platform may mutate another platform's table directly via raw SQL or ORM queries. All mutations MUST pass through the owning platform's public service contract.
- **Rule 3**: External platforms store only foreign key references (`user_id`, `listing_id`) and MUST query the SSOT platform for authoritative entity states.

---

## 2. Entity Ownership Mapping

```
┌─────────────────────────┬──────────────────────────┬────────────────────────────────────────────────────────┐
│ Entity / Data Model     │ Owning Platform          │ Primary Data Tables                                    │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Users & Profiles        │ Identity Platform        │ profiles, auth_sessions, user_roles                    │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Businesses              │ Identity Platform        │ seller_businesses, business_members                    │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Listings                │ Discovery Platform       │ listings, listing_amenities, listing_categories        │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Conversations & Messages│ Communication Platform   │ conversations, messages, connect_audit_logs            │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Viewings                │ Communication Platform   │ scheduled_viewings                                     │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Trust Scores & Badges   │ Trust Platform           │ trust_scores, trust_badges, verifications              │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Inspections             │ Trust Platform           │ field_inspections, inspection_reports                  │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Subscriptions           │ Revenue Platform         │ subscriptions, subscription_plans, billing_terms       │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Leads                   │ Seller Success Platform  │ seller_leads, lead_activity_logs                       │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Reviews                 │ Identity / Trust Platform│ reviews, seller_ratings                                │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Media Assets            │ Media Platform           │ media_assets, upload_logs                              │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Notifications           │ Notification Platform    │ notifications, dispatch_logs                           │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────┤
│ Payments & Deals        │ Commerce Platform        │ payments, escrow_transactions, deals                   │
└─────────────────────────┴──────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 3. Anti-Duplication Enforcement Examples

1. **User Role Status**: Role status (e.g. `role = "agent_verified"`) is owned exclusively by `Identity Platform`. `Discovery Platform` MUST NOT duplicate role flags on listing tables.
2. **Active Listing Limits**: The active listing limit for a tier is owned by `Revenue Platform`. `Discovery Platform` queries `SubscriptionService.getActiveSubscription()` before creating or publishing listings.
3. **Verification Badges**: Badges are calculated exclusively by `Trust Platform`. Front-end components read badge arrays from `TrustService.getBadgesForSeller()`.
