# Sign-in UX Report

**Status:** Ready for founder review — **no commit**  
**Scope:** `/auth/login` calm entry — header, fields, links, marketing removal  
**Auth architecture:** Unchanged (`POST /api/auth/login` still accepts `identifier` + secret ≥6)

## Changes

| Area | Before | After |
|------|--------|-------|
| Header title | “Sign in to Yike” (left) | Centered **Welcome Back** |
| Subtitle | None | **Continue where you left off.** |
| Marketing list | Verified listers / rent-buy / WhatsApp | Removed (`compact` + `centered`) |
| City trust line | “Trusted across Lagos…” | Removed |
| Email label | “Email or username” (uppercase muted) | **Email Address** (signup Field typography) |
| Secret label | “Password” | **PIN** |
| Helper | PIN or password mention | **Use your 6-digit PIN to sign in.** |
| Recovery link | Forgot password? | **Forgot PIN?** → `/auth/forgot-password` |
| Footer | Don’t have an account? Create one free | **New to Yike?** / **Create your account** |
| CTA | Sign in | **Sign In** |

## Layout (email form)

```
Yike Logo
Welcome Back
Continue where you left off.
Email Address
PIN
Forgot PIN?
[ Sign In ]
────────
New to Yike?
Create your account
```

## Backend notes (UI only)

- Login API still resolves **email or username** via `resolveLoginEmail`; UI is email-first (`type="email"`).
- Secrets ≥6 still accepted (6-digit PIN primary; longer legacy passwords still work server-side without UI marketing).

## Quick-PIN returning user

- Saved-device PIN pad unchanged; AuthShell header omitted so the panel owns welcome copy.
- Marketing still suppressed (`compact`).

## Local check

- `http://127.0.0.1:3000/auth/login` → **200**
- HTML includes Welcome Back / Email Address / Forgot PIN? / Create your account
- Marketing strings absent from response

## Files

- `src/app/auth/login/login-client.tsx`
