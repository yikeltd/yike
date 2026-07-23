# Security Validation Report — Signup PIN

**Status:** Ready for founder review — **no commit**  
**Goal:** Weak PINs cannot bypass via direct API while UI stays non-revealing.

## Client

| Control | Location |
|---------|----------|
| Digits-only, max 6 | `signup-form.tsx` |
| `pinPolicyError` before submit | `signup-form.tsx` |
| Immediate reject on 6th digit if weak | `signup-form.tsx` |
| `canSubmit` requires `isValidSignupCredential(pin)` | `signup-form.tsx` → `password-policy` → `pin-policy` |

## Server (same module)

| Route | Enforcement |
|-------|-------------|
| `POST /api/auth/signup` | `signupCredentialError(password)` + `pinPolicyError(pin)` |
| `POST /api/auth/pin/setup` | `pinPolicyError` |
| `POST /api/auth/pin/reset` | `pinPolicyError` |
| `hashPin` / `src/lib/pin.ts` | `pinPolicyError` before hash |

Bypassing the form with `password: "123456"` returns **400** with the generic weak-PIN message. Exact rule text is not returned.

## Message policy

- User-facing: **Choose a less predictable PIN for better security.**
- Length failures still say “PIN must be exactly 6 digits” (format, not strength).
- No checklist items that describe sequential / repeating rules on signup.

## Auth architecture

Unchanged:

1. Email + local phone + PIN signup  
2. Email OTP verification  
3. PIN stored as Supabase Auth password + profile `pin_hash`  
4. No new auth providers, sessions, or OTP channels
