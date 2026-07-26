# Version 2 Backlog (Feature Freeze)

Items discovered or deferred during Final Launch Sprint (2026-07-26).  
**Do not implement during freeze** unless founder promotes an item to Critical.

| ID | Item | Notes |
|----|------|-------|
| V2-01 | Vendor crash monitoring (Sentry or equivalent) | Soft-launch OK with `global-error` |
| V2-02 | CI lint warning debt cleanup | Coolify deploys from `main` independently |
| V2-03 | Bare `/api/health` JSON alias | Use `/api/public-health` today |
| V2-04 | Hub latency (`/rent` `/land` ~2.2s+) | Observe after real inventory growth |
| V2-05 | Stolen-image auto review queue | See media roadmap |
| V2-06 | Intelligent watermark placement | Deferred by design |
| V2-07 | Live Paystack boosts / featured | Off for launch |
| V2-08 | SMS/Sendchamp OTP productization | Email OTP first; SMS isolated |
| V2-09 | Vehicles full marketplace push | Only after supply + flag |
| V2-10 | Empty-state honesty polish for soft-launch cities | Optional if framing declared |
| V2-11 | Help / FAQ hub | Contact + Safety may suffice MVP |
| V2-12 | Passport / wallet / escrow / chat / AI | Explicitly frozen |
| V2-13 | AI recommendations / personalization / ML | Explicitly frozen — post-launch behaviour first |
| V2-14 | Reviews / financing / insurance / vehicle history / auctions | Explicitly frozen |
| V2-15 | Dealer subscriptions / premium analytics (seller-facing) | Explicitly frozen — staff control tower exists |
| V2-16 | Year→trim/engine/HP factory catalog | Needs curated data or external API |
| V2-17 | LLM auto description assistant | Copy/AI product surface |
| V2-18 | Live price intelligence / comps bands | Needs reliable comps + honesty UX |
| V2-19 | Dealer response rate / ratings productization | Only when metrics exist |
| V2-20 | Media quality AI (blur/dark/angle beyond pipeline) | Beyond current media protection |

Promote items only via founder written override.

**2026-07-26:** Progressive Disclosure Phase 1 (IA/UX) is a founder override — see [INTELLIGENT_MARKETPLACE_EXPERIENCE.md](./INTELLIGENT_MARKETPLACE_EXPERIENCE.md). Full intelligent listing = V2-16+.

**Permanent doctrine (not V2):** [Intelligent Marketplace OS](../product/INTELLIGENT_MARKETPLACE.md) + [YDS](../design/YIKE_DESIGN_SYSTEM.md) govern all future UI. V2-16+ are the *automation depth* items that still need data/APIs.
