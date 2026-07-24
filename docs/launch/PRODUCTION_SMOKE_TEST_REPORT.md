# Production Smoke Test Report

**Date:** 2026-07-24  
**Commit scope:** Design Language 2026 + P0 single-path phone OTP  

## Verified in this session

| Item | Status |
|------|--------|
| OTP single-path code (branded SMS only) | Verified by grep + source review |
| Exact SMS template string | Verified in `copy.ts` |
| Hash OTP + invalidate-on-resend + button locks | Verified in service/UI code |
| `tsc --noEmit` | Run as ship gate |
| `npm run build` | Run as ship gate |
| Local property/vehicle detail HTTP 200 | Attempted when dev server healthy |

## Not verified here (founder on yike.ng)

1. Coolify Production = Ready for this commit  
2. Live SMS: Send code → receive branded body (not “Hi There”) → verify succeeds  
3. Resend: prior code fails; new code works; cooldown locks button  
4. Property + vehicle detail visual polish on production CDN  
5. WhatsApp sticky CTA opens correct number  

## Smoke order after deploy

1. https://yike.ng — home loads  
2. Open one property + one vehicle detail  
3. Seller/profile phone verify: one SMS, branded copy, verify OK  
4. Spot-check signup/login email OTP unchanged  
