# Signup UX Report

**Status:** Ready for founder review — **no commit**  
**Scope:** `/auth/signup` header, PIN helper, phone field affordances  
**Auth architecture:** Unchanged (email OTP → PIN-as-password → profile)

## Changes

| Area | Before | After |
|------|--------|-------|
| Header title | “Create Account” (left) | Centered **Welcome to Yike** |
| Subtitle | None | **Create your account in under a minute.** |
| Typography | Default AuthShell left stack | `centered` prop — tighter tracking, premium spacing under logo |
| PIN helper | Always visible under Create PIN | Hidden until first digit; fades in; hides at 6 digits; returns if edited |
| Phone field | Free `tel` input | Digits only, max 11, `inputMode="numeric"`, blur/submit validation |

## UX notes

- Logo remains the primary brand signal; welcome title is secondary and centered beneath it.
- CTA button label stays **Create Account** (action clarity).
- Weak PIN errors surface under Create PIN when confirm is empty, and under Confirm PIN once confirm has digits.
- Phone placeholder `08031234567` sets the expected local format without accepting `+234`.

## Local check

- `http://127.0.0.1:3000/auth/signup` → **200**
- Hot reload picks up form + AuthShell changes

## Files

- `src/app/auth/signup/signup-form.tsx`
- `src/components/auth/auth-shell.tsx` (`centered` prop)
