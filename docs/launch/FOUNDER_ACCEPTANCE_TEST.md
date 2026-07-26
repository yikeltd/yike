# Founder Acceptance Test (FAT) — Printable Checklist

**Product:** Yike.ng · Property + Vehicle marketplace soft-launch  
**Feature freeze:** ACTIVE  
**Owner:** Founder  
**Estimated time:** 2–3 hours  
**Date:** _______________ **Initials:** _______________  
**Report:** [FINAL_PRE_LAUNCH_REPORT.md](./FINAL_PRE_LAUNCH_REPORT.md)

Print or copy into a notes app. Check only what you personally verified on the **target environment** (staging FAT or production).

---

## SMS bypass for FAT (testing only)

| Setting | Value |
|---------|--------|
| FAT window | `AUTH_SMS_VERIFICATION_ENABLED=false` |
| Public launch | `AUTH_SMS_VERIFICATION_ENABLED=true` (required) |

When bypass is active you should see: **Testing Mode — SMS Verification Temporarily Disabled**

Seller phone: enter number → **Send code** → phone marks verified **without SMS**.

**Before public launch:** set flag `true`, confirm banner gone, run **one real SMS** end-to-end.

---

## Pass rules

- **Critical fail** → NO-GO until fixed or explicitly accepted in writing  
- **High fail** → NO-GO unless accepted risk documented  
- Cosmetic / V2 → log only; do not block

---

## Full journey (execute in order)

Guest → Register → Login → Profile → Browse → Search → Save → Contact dealer → Create listing → Upload images → Submit → Admin review → Approve → Live → View → Dealer contact → Logout

Use sections A–E below as the detailed checklist for that journey.

---

## A. Guest (not signed in)

| # | Step | Pass | Fail | Notes |
|---|------|:----:|:----:|-------|
| A1 | Open https://yike.ng — homepage loads, logo + inventory rails visible | ☐ | ☐ | |
| A2 | Open a property card → detail page loads (~3s) | ☐ | ☐ | |
| A3 | WhatsApp CTA visible on detail | ☐ | ☐ | |
| A4 | `/search` — type city (e.g. Lagos) — results update | ☐ | ☐ | |
| A5 | Filter by bedrooms / price if UI exposes them | ☐ | ☐ | |
| A6 | `/privacy` `/terms` `/safety` `/contact` load | ☐ | ☐ | |
| A7 | Mobile: bottom nav Home / Discover / Sell / Saved / Account usable | ☐ | ☐ | |
| A8 | `/vehicles` loads and shows vehicle inventory / empty state (must be live — flagship) | ☐ | ☐ | |

---

## B. Buyer (signed in, browsing)

| # | Step | Pass | Fail | Notes |
|---|------|:----:|:----:|-------|
| B1 | Sign up or log in with **email OTP** | ☐ | ☐ | |
| B2 | Save a listing → appears in Saved | ☐ | ☐ | |
| B3 | Unsave works | ☐ | ☐ | |
| B4 | WhatsApp contact from listing (opens WA with sensible message) | ☐ | ☐ | |
| B5 | Profile page loads; sign out works | ☐ | ☐ | |

---

## C. Seller (list a property / vehicle)

| # | Step | Pass | Fail | Notes |
|---|------|:----:|:----:|-------|
| C0 | If FAT bypass: banner visible; phone verifies without SMS | ☐ | ☐ | |
| C1 | Start “Sell” / post property (or vehicle) flow | ☐ | ☐ | |
| C2 | Complete required fields with real Nigerian data | ☐ | ☐ | |
| C3 | **Upload one real photo** (Media Protection smoke) | ☐ | ☐ | |
| C4 | Public preview shows watermarked image | ☐ | ☐ | |
| C5 | Submit for review / publish per current gates | ☐ | ☐ | |
| C6 | Seller dashboard shows the listing | ☐ | ☐ | |

Media smoke detail: [MEDIA_PROTECTION_PRODUCTION_SMOKE.md](./MEDIA_PROTECTION_PRODUCTION_SMOKE.md)

---

## D. Verified Agent / Agency

| # | Step | Pass | Fail | Notes |
|---|------|:----:|:----:|-------|
| D1 | Open agent/profile or storefront for a verified agent | ☐ | ☐ | |
| D2 | Agent listings visible | ☐ | ☐ | |
| D3 | Verification badge displays where expected | ☐ | ☐ | |
| D4 | Contact / WhatsApp path works | ☐ | ☐ | |
| D5 | Agent can edit own listing (if role available) | ☐ | ☐ | |

---

## E. Administrator (Lex)

| # | Step | Pass | Fail | Notes |
|---|------|:----:|:----:|-------|
| E1 | `/lex` → staff login succeeds | ☐ | ☐ | |
| E2 | Listings moderation queue loads | ☐ | ☐ | |
| E3 | Approve a pending listing (or confirm empty queue) | ☐ | ☐ | |
| E4 | Reject / request changes path works (or N/A) | ☐ | ☐ | |
| E5 | Search listings in admin | ☐ | ☐ | |
| E6 | View users / vendors as available | ☐ | ☐ | |
| E7 | Lex Tech → Uploads & Protection shows media row from C3 | ☐ | ☐ | |
| E8 | Sample Listing badge visible on demo rows; purge tools present | ☐ | ☐ | |
| E9 | Reports / moderation tools open without error | ☐ | ☐ | |
| E10 | Non-staff account cannot access `/lex` console | ☐ | ☐ | |
| E11 | Lex Tech → SMS verification shows Expected (Required or BYPASS) | ☐ | ☐ | |

---

## F. Founder ops gates (same session)

| # | Gate | Pass | Fail / Accepted risk | Notes |
|---|------|:----:|:--------------------:|-------|
| F1 | Coolify `ENABLE_VEHICLE_MARKETPLACE=true` (or unset) — Vehicles **ON** for Day 1 | ☐ | ☐ | |
| F2 | Supabase leaked-password protection ON | ☐ | ☐ | |
| F3 | OTP / Sendchamp secrets rotated if ever exposed | ☐ | ☐ | |
| F4 | Soft-launch framing honest for thin inventory OR supply plan dated | ☐ | ☐ | |
| F5 | Backup/PITR status checked in Supabase Dashboard | ☐ | ☐ | |
| F6 | Prior Coolify deployment available for rollback | ☐ | ☐ | |
| F7 | **Pre-launch:** `AUTH_SMS_VERIFICATION_ENABLED=true` + banner gone | ☐ | ☐ | |
| F8 | **Pre-launch:** one real SMS send → receive → verify succeeds | ☐ | ☐ | |

---

## Sign-off

| Role | GO for soft-launch? | Date | Initials |
|------|---------------------|------|----------|
| Founder | ☐ Yes ☐ No | | |
| Ops (if separate) | ☐ Yes ☐ No ☐ N/A | | |

**Blockers found:**  
_______________________________________________________________  
_______________________________________________________________  

**Accepted risks (written):**  
_______________________________________________________________  
_______________________________________________________________  

After completion: update [LAUNCH_COMMAND_CENTER.md](./LAUNCH_COMMAND_CENTER.md) — close **C10** and attach this dated checklist.
