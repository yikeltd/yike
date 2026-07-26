# Root Cause Analysis — Charged OTP SMS, No Delivery

**Date:** 2026-07-26  
**Severity:** Production-blocking  
**Method:** Full code-path trace (no live Sendchamp wallet access on this machine)  
**Commit status:** **Not committed — awaiting founder review**

## Verdict

**Primary code defect (charge amplifier):** One user tap could trigger **more than one billable Sendchamp call**.

That matches “users are being charged” even when the handset shows no SMS (or shows one SMS while wallet shows 2+).

**Secondary (delivery):** Even a single successful `/verification/create` can be accepted by Sendchamp (wallet debit) while the carrier never delivers. That requires Sendchamp delivery logs + DND/route status — not guessable from app code alone. Audit logs now capture full HTTP envelopes for that diagnosis.

## Evidence from code (pre-fix)

### A. Verification success → branded `/sms/send` fallback (double charge)

`provider.ts` / `otp/service.ts` called:

1. `POST /verification/create` (`in_app_token: false`) — **billable**
2. On any “failure”, `sendBrandedSmsOtp` → `POST /sms/send` — **billable again**

Failure included cases where Sendchamp may already have charged:

- Missing `verification_reference` after HTTP success
- Timeout after accept
- Parse / envelope mismatch (`isSendchampSuccess` false-negative)

UI could then show success from the second path (different OTP) while the first SMS never arrived — or show success with zero SMS if both “succeeded” at API but failed at carrier.

### B. Timeout retries on billable POST (`sendchamp.ts`)

`FETCH_RETRIES = 2`: network/timeout after Sendchamp accepted → **second POST** → second charge.

### C. Multi-route `/sms/send` spray

Fallback tried up to **5 routes** (`dnd`, `DND_NG`, `PREMIUM_NG`, `non_dnd`, `NON_DND_NG`). Each successful or partially accepted call is a charge attempt.

### D. Dual API keys

Loop over `SENDCHAMP_API_KEY` then `SENDCHAMP_PUBLIC_KEY` after non-401 failures — second key can charge again.

### E. Broad custom-message retry

Retry without `meta_data.message` when error matched `/invalid/i` — too broad; risk of second create after a charged rejection.

## Ruled out (from code)

| Hypothesis | Finding |
|------------|---------|
| React Strict Mode double mount send | No — send is click-only |
| Duplicate onClick handlers | No — single handler + `sendLockRef` |
| Frontend auto-retry | No |
| Two OTP generators on success path after fix | Removed |

## Not yet proven from production data

- Exact Sendchamp delivery_status for unpaid/no-handset events (need Coolify `[otp-audit]` lines + Sendchamp dashboard)
- Multi-pod race (possible, secondary)

## Mapping to user symptom

| Symptom | Most likely code cause |
|---------|------------------------|
| Wallet debit, no SMS | Chargeable create accepted; carrier/DND drop **or** UI success from wrong path |
| Multiple debits per tap | A+B+C+D above |
| Code never works | Verification SMS code ≠ local hash after branded fallback |
