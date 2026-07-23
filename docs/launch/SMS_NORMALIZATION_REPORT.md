# SMS Normalization Report — Signup Phone

**Status:** Ready for founder review — **no commit**  
**Auth OTP channel:** Email OTP on signup (unchanged). Phone is stored for profile / later SMS verification.

## Local → international

| Local (signup) | Canonical | Helper |
|----------------|-----------|--------|
| `08031234567` | `2348031234567` | `normalizePhoneForDuplicateCheck` / `toInternationalNigerianPhone` |
| `08120749537` | `2348120749537` | same |
| `09012345678` | `2349012345678` | same |

Sendchamp path (when SMS OTP is requested later):

- `toSendchampPhone(local)` → `234…` (no `+`)
- `toInternationalNigerianPhone` used in phone-verification + WhatsApp verification services

## Signup storage

1. UI collects local `0803…` only  
2. API validates `isLocalNigerianSignupPhone`  
3. Duplicate / profile phone: local `0` + 10-digit national from `234…`  
4. SMS providers continue to receive `234…` via existing helpers — **no new SMS architecture**

## Explicit non-goals

- Signup does **not** switch primary verification to SMS  
- Email OTP remains the signup confirmation path  
- No change to Sendchamp credentials or webhook flow
