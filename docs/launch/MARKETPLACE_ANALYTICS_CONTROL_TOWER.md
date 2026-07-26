# Marketplace Analytics Control Tower

**Audience:** Founder / ops / staff (`/lex/auth`) — **not** a consumer feature  
**Status:** Shipped (read-only dashboard over existing tables)  
**Feature freeze:** ACTIVE — this is the **last** allowed engineering exception before launch execution  
**Date:** 2026-07-26  
**Route:** [`/lex/auth/marketplace-analytics`](https://yike.ng/lex/auth/marketplace-analytics) (staff session required)

---

## Why this exists

Launch day needs a pulse board: inventory, users, activity, trust, growth.  
No AI, no customer personalization — **observe** what already happens in the database.

---

## What it shows

| Section | Metrics | Source |
|---------|---------|--------|
| Marketplace | Total / Vehicle / Property / Pending / Approved / Rejected | `properties` |
| Users | New today / Sellers / Buyers / Dealers / Verified dealers | `profiles` |
| Activity (today) | Search impressions / Views / Contacts / Saves / Reports | `listing_analytics_events`, `funnel_events`, `favorites`, `listing_reports` |
| Inventory | City heatmap, category, make, price buckets | Approved `properties` sample |
| Trust | Verified sellers, media-protected listings, flagged, pending, open reports | `profiles`, `media_assets`, `properties`, `listing_reports` |
| Growth | Daily / weekly / monthly listings & users | Counts by `created_at` |

**Honest gaps**

- **Dealer profile views:** not persisted → shows “—”
- **Search:** uses `search_impression` when logged; client-only `trackEvent("search")` is not counted here

---

## What was not changed

- No migrations / schema  
- No new public APIs  
- No consumer UI  
- No recommendation / AI systems  

---

## Related

- CEO revenue analytics (existing): `/lex/auth/analytics`  
- Command Center: freeze remains; supply / FAT / media smoke still gate GO/NO-GO  

## After this

**Stop product engineering.** Next: acquire dealers & inventory → FAT → launch config → support → observe this dashboard → V2 only from real behaviour.
