# Footer Simplification Report

**Date:** 2026-07-26  
**Surface:** Public site footer (`SiteFooter` via `PublicFooter`)  
**Commit status:** **Not committed — awaiting founder review**

## Objective

Reduce clutter, improve scanning, and strengthen trust with a premium four-column layout aligned to Design Language 2026.

## Structure (shipped)

| Column | Content |
|--------|---------|
| 1 | Logo + tagline: *Nigeria's trusted marketplace for verified property and vehicles.* |
| 2 · Explore | Buy Property · Rent Property · Vehicles · Land · Sell on Yike |
| 3 · Company | About · Contact · Safety Centre · Become Verified |
| 4 · Legal | Terms · Privacy · Cookies |

**Bottom bar**

- `© 2026 Yike Ltd. All rights reserved.`
- `RC-9552998`
- One notice: *Yike is an online marketplace. Always inspect listings and verify before making payments.*

## Removed

- Duplicate “Explore” nav item and dense Explore list (Property / Explore / Rent / Buy / Shortlet / Swipe / Pricing / Request / Guides, etc.)
- Pricing, Request a home, Guides, Moderation policy
- Long disclaimer + disclaimer link paragraph
- Phone number and email block
- Careers, Why verified, Delete account, Disclaimer links from footer
- Footer social (`FollowYike`) — not in the approved structure

## Design notes

- More vertical rhythm (`py-14` / `gap-12`, looser link spacing)
- Gold uppercase column labels; quieter link weight (`white/80`)
- Softer tagline and legal copy contrast for hierarchy
- Divider opacity eased for a calmer band

## Files

- `src/components/layout/site-footer.tsx` — rewrite
- `src/app/globals.css` — footer divider / legal polish

## Preview

Local: `http://localhost:3000` (scroll to footer on any public page).

## Out of scope

- Footer ad strip (`AdSlot` in `PublicFooter`) unchanged
- PWA hide-footer behavior unchanged
