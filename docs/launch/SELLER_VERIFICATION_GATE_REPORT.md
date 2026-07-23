# Seller Verification Gate Report — Phone before list

**Date:** 2026-07-23  
**Policy:** Browse free after email · Phone required before sell/list

## Allowed without phone

- Browse / search / save / WhatsApp contact to sellers

## Blocked without phone

| Surface | Behavior |
|---------|----------|
| `/agent/listings/new` | Redirect → `/auth/verify-phone?next=…` |
| `POST /api/agent/listings/create` | `assertCanCreateListing` → `phone_verification_required` (403) |
| Become seller (`/api/agent/become`) | Blocks with `phone_verification_required` + `next` to verify-phone |
| Seller verification submit | Requires phone first |
| Listing form client | Redirects on `phone_verification_required` |

## Gate helpers

- `assertCanCreateListing` / `mustVerifyPhoneBeforeListing` — `src/lib/seller-trust/gates.ts`
- `isPhoneVerifiedForSeller` — `phone_verified` **or** WhatsApp-verified status
- Message: **“Verify your phone to start selling.”**

## Publish vs create

- **Create/submit:** email + phone required; seller badge not yet required
- **Go live / publish:** still requires Verified Seller (`assertCanPublishListing`) — unchanged Identity v1

## WhatsApp listing prompt

- Soft prompt only when `ENABLE_WHATSAPP_OTP` is on
- SMS is the hard listing gate — WhatsApp Business OTP is future

## Flow alignment

```
Email verified → browse OK
Tap List Property/Vehicle
  → “Verify your phone to start selling.”
  → SMS OTP
  → continue listing wizard
```
