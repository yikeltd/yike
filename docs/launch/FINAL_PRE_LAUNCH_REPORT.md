# Final Pre-Launch Report — Founder Acceptance Test Sprint

**Date:** 2026-07-26  
**Phase:** Final engineering sprint before public launch  
**Feature freeze:** ACTIVE — no new product features  
**Companion:** [FOUNDER_ACCEPTANCE_TEST.md](./FOUNDER_ACCEPTANCE_TEST.md) · [LAUNCH_COMMAND_CENTER.md](./LAUNCH_COMMAND_CENTER.md)

---

## Mission

Prepare Yike for public launch by:

1. Enabling a **temporary SMS verification bypass** for FAT (env-controlled only)
2. Completing / documenting Founder Acceptance Testing
3. Polishing launch readiness without architectural changes

**Do not** weaken production security permanently. Re-enable SMS with one env flip before launch.

---

## Completed items

| Item | Status |
|------|--------|
| Launch Health Dashboard (`/lex/auth/health`) | ✅ |
| `AUTH_SMS_VERIFICATION_ENABLED` flag (default **true** = SMS required) | ✅ |
| FAT bypass marks phone verified without Sendchamp when flag=`false` | ✅ |
| Listing create gate respects bypass | ✅ |
| Amber testing banner when bypass active | ✅ |
| Lex Tech metric for SMS verification / bypass | ✅ |
| Production env validation warns if bypass left on | ✅ |
| `.env.example` documented | ✅ |
| Marketplace placement system (Featured / Trending / Recently) | ✅ Prior sprint |
| Progressive disclosure / YDS detail polish | ✅ Prior sprint |
| Search / filter chrome polish | ✅ Prior sprint |

---

## SMS verification bypass (FAT only)

### Config

```bash
# Default / production / public launch
AUTH_SMS_VERIFICATION_ENABLED=true

# Staging or controlled FAT window only
AUTH_SMS_VERIFICATION_ENABLED=false
```

Unset → **true** (secure default). No code change to re-enable SMS.

### Behaviour when `false`

- Seller “Send code” marks `phone_verified` immediately (no SMS)
- Create-listing phone gate is waived while bypass is active
- Banner: **Testing Mode — SMS Verification Temporarily Disabled**
- Lex → Tech shows **SMS verification: BYPASS (FAT)**

### Before public launch (mandatory)

1. Set `AUTH_SMS_VERIFICATION_ENABLED=true` in Coolify  
2. Confirm banner is gone  
3. Run **one complete real SMS** end-to-end (send → receive → verify → list)  
4. Re-run critical FAT seller path  
5. Confirm production auth matches customer experience  

---

## Outstanding items (founder / ops)

| Item | Owner | Class |
|------|-------|-------|
| Execute printable FAT checklist on target env | Founder | FOUNDER |
| Real SMS E2E after re-enable | Founder + ops | BLOCKER for public launch |
| Real vehicle/property supply depth | Founder | FOUNDER |
| Media Protection production smoke (real upload) | Founder | FOUNDER |
| Supabase leaked-password protection ON | Founder | FOUNDER |
| Coolify env confirm (`ENABLE_VEHICLE_MARKETPLACE`, SMS flag) | Ops | FOUNDER |

---

## Known risks

| Risk | Mitigation |
|------|------------|
| Bypass left on in production | Banner + Lex metric + startup warn; Part 14 checklist |
| SMS provider still flaky after re-enable | One mandatory live SMS test before marketing push |
| Thin inventory | Soft-launch framing / supply plan |
| FAT not yet executed end-to-end in this sprint | Checklist ready; founder executes |

---

## Launch readiness (engineering view)

| Area | Status |
|------|--------|
| Auth (email OTP) | READY |
| Auth (SMS seller phone) | READY when flag=true + provider healthy; FAT via bypass |
| Marketplace browse / search | READY |
| Listing create / media pipeline | READY · founder smoke pending |
| Admin moderation | READY |
| Payments / Featured | CONDITIONAL (flags) |
| Feature freeze | ACTIVE |

**Headline:** Engineering ready for FAT. **Public launch NO-GO** until FAT signed, SMS re-enabled + live-verified, supply/media/security gates closed.

---

## Performance summary

- Image lazy-load / `next/image` / browse poster cards in place  
- Discover deck soft-boosts Featured without changing filters  
- No heavy new deps in this sprint  
- Recommend Lighthouse pass on `/`, `/vehicles`, detail after FAT

---

## Security summary

- Bypass **opt-in** via env; default secure  
- No schema / RLS / API permission changes for bypass  
- Trust badges remain non-purchasable (placement ≠ trust)  
- Do not leave `AUTH_SMS_VERIFICATION_ENABLED=false` after FAT  

---

## Accessibility summary

- Existing ARIA on menus / selects / bottom nav retained  
- Bypass banner uses `role="status"`  
- Recommend keyboard pass on Sell + Lex during FAT  

---

## Mobile review (checklist for FAT)

Confirm on a real device during FAT:

Homepage · Discover · Vehicles · Properties · Detail · Dealer · Saved · Sell · Account · Search  

Touch targets, safe areas, sticky CTAs, scroll, landscape.

---

## Design system / experience

- Placement tiers documented: [MARKETPLACE_PLACEMENT_SYSTEM.md](./MARKETPLACE_PLACEMENT_SYSTEM.md)  
- Progressive disclosure / YDS: prior Intelligent Marketplace sprint  
- No redesign in this sprint  

---

## Launch checklist (PASS / FAIL / N/A)

| Domain | Status |
|--------|--------|
| Infrastructure (Coolify / SSL) | PASS (ops confirm) |
| Authentication (email OTP) | PASS |
| SMS (seller phone) | FAIL until flag=true + live SMS |
| Email | PASS (ops confirm Resend) |
| Media Protection | N/A eng · FOUNDER smoke |
| Search | PASS |
| Marketplace browse | PASS |
| Payments | N/A / CONDITIONAL |
| Listings create | PASS (with SMS bypass or verified phone) |
| Dealer experience | PASS |
| Property | PASS |
| Vehicles | PASS (supply FOUNDER) |
| Security baseline | PASS · leaked-password FOUNDER |
| Monitoring / Lex Tech | PASS |
| Analytics | PASS |
| Backups / PITR | FOUNDER confirm |
| Environment variables | PASS · confirm SMS flag |

---

## Founder recommendations

1. Run FAT on staging with `AUTH_SMS_VERIFICATION_ENABLED=false` to unblock seller journey.  
2. Sign the printable FAT checklist.  
3. Flip SMS **on**, run **one real SMS E2E**, then soft-launch.  
4. Do not market push while bypass banner is visible.  
5. Keep feature freeze until after launch week stability.

---

## Success criteria (this sprint)

- [x] SMS bypass env-controlled; not default  
- [x] Banner when bypass active  
- [x] Docs updated (this report + FAT + Command Center)  
- [ ] Founder FAT executed (human)  
- [ ] SMS re-enabled + live verified (human)  
- [ ] Public launch GO (founder sign-off)  
