# SMS OTP Live Validation — Delivery Failure

**Date:** 2026-07-26  
**Decision:** **NO-GO for “delivery fixed”** — provider reports `sent`, handset receives nothing  
**Duplicate-charge app fix:** still valid; **not the cause of zero SMS**

## Evidence (same destination `2348126775227`)

| Source | Sender | API | Wallet | Handset |
|--------|--------|-----|--------|---------|
| Yike validation script | `Yike` | HTTP 200, `status: success`, `data.status: sent`, ref `MN-OTP-af61aff0-…` | Charged | **No SMS** |
| Sendchamp dashboard Test OTP | `YIKE` (Approved) | HTTP 200, `status: success`, `data.status: sent`, ref `MN-OTP-3982d30f-…` | Charged | **No SMS** |

Dashboard failure with the approved sender means **Yike app code is not blocking delivery**. Sendchamp accepts the OTP create (and bills) while the message never arrives on this MSISDN.

## What this is / isn’t

| Hypothesis | Verdict |
|------------|---------|
| Duplicate Yike API calls | Ruled out for this test (one create) |
| Wrong Yike fallback `/sms/send` | Ruled out for this test (verification only) |
| Sender ID casing `Yike` vs `YIKE` | Unlikely sole cause — dashboard `YIKE` also failed |
| Phone formatting | Unlikely — both used `2348126775227` |
| Sendchamp / carrier / DND / account routing | **Primary suspect** |

## Security (urgent)

A **live** `Authorization: Bearer sendchamp_live_…` key was pasted in chat.

1. **Rotate / revoke that key** in Sendchamp immediately.  
2. Put the **new** key only in Coolify / `.env.local` — never in chat or commits.  
3. Treat the leaked key as compromised.

## Next actions (Sendchamp / ops — not more Yike code guesses)

1. Open a Sendchamp support ticket with both transaction IDs:
   - `MN-OTP-af61aff0-4f22-4ff5-acef-1647fec108a2`
   - `MN-OTP-3982d30f-34f7-41c2-b142-5fce703e8b0e`  
   Ask: delivery report, DND route, SMS wallet vs OTP product, why `status: sent` with no handset delivery.
2. Test **another phone** on a different network (MTN / Airtel / Glo).
3. In Sendchamp dashboard, check SMS logs / delivery reports for those refs (delivered vs failed vs DND).
4. Keep app sender as approved **`YIKE`** (`.env.local` aligned).

## Commit stance

- **Do not** commit claiming SMS delivery is fixed.  
- App-side **single `/verification/create`** (no double bill from Yike) can still ship **after** you confirm you want that hardening alone.  
- Footer cleanup remains separate / uncommitted until you say go.
