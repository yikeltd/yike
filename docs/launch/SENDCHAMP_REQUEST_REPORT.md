# Sendchamp Request Report — OTP SMS

**Date:** 2026-07-26  
**Commit status:** **Not committed — awaiting founder review**

## Production request (after fix)

**Endpoint:** `POST {SENDCHAMP_LIVE_BASE_URL}/verification/create`  
**Auth:** `Bearer` first configured key (`SENDCHAMP_API_KEY` or `SENDCHAMP_PUBLIC_KEY`)  
**Billable:** yes (`in_app_token: false`)

### Payload shape

```json
{
  "channel": "sms",
  "token_type": "numeric",
  "token_length": 6,
  "expiration_time": 30,
  "customer_mobile_number": "234XXXXXXXXXX",
  "customer_email_address": "",
  "meta_data": {
    "app": "Yike",
    "brand": "Yike",
    "purpose": "phone_verification",
    "description": "Yike phone verification",
    "message": "Your verification code is: {{code}}. Code is valid for 30 minutes. Never share this code. Welcome to Yike. Happy Listing."
  },
  "in_app_token": false,
  "sender": "YIKE"
}
```

### Success criteria

- HTTP 2xx
- Envelope parsed by `isSendchampSuccess`
- `data.verification_reference` (or `reference` / `id`) present
- Stored on `whatsapp_otp_sessions.provider_reference`

### Confirm

`POST /verification/confirm` with `{ verification_reference, verification_code }` — not billable for a new SMS.

## Paths explicitly disabled in the same user action

| Path | Why disabled |
|------|----------------|
| `/sms/send` after Verification | Double-charge when Verification already accepted |
| Multi-route `/sms/send` spray (`dnd`→`DND_NG`→…) | Multiple charge attempts per tap |
| Timeout retry on billable POST | Classic “charged then retried” |
| Second API key after HTTP response | Ambiguous double charge |
| Broad `/invalid/` custom-message retry | Could retry after a charged rejection |

## Temporary audit logs

Prefix: `[otp-audit]` JSON lines.

Fields: `requestId`, `phone`, `otpHash`, `reference`, `path`, `requestPayload`, `httpStatus`, `responseBody`, `responseHeaders`, `deliveryReference`, `deliveryStatus`, `retryCount`, `durationMs`.

Control:

```
OTP_DELIVERY_AUDIT=true          # default ON until investigation closes
OTP_DELIVERY_AUDIT_REDACT=true   # hash phone / truncate hashes
```

Module: `src/lib/otp/delivery-audit.ts`
