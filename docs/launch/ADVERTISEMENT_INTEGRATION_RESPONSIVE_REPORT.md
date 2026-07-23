# Advertisement Integration Report — Responsive Homepage

**Date:** 2026-07-23  

---

## Model

Shared smart slots — **presentation fork does not fork ads**.

| Slot | Placement key | Position in rails |
|------|---------------|-------------------|
| 1 | `homepage_slot_1` | After Featured |
| 2 | `homepage_slot_2` | After Recently Added |
| 3 | `homepage_slot_3` | After Near You / Low Mileage |
| 4 | `homepage_slot_4` | After Luxury |
| 5 | `homepage_slot_5` | After Recommended |

## Behavior

- `getHomepageAds()` on server (`page.tsx`) — unchanged
- `HomeAdSlot` renders **nothing** when ad missing / inactive / no image
- Same slots on mobile and desktop; only surrounding chrome differs
- No new schema invented for this refactor

## Notes

- Existing homepage ad migration / Lex manager docs remain the source of truth for ops
- Compact banner styling unchanged (`SponsoredAdBanner` compact)
