# Phone Input Validation Report

**Status:** Ready for founder review — **no commit**  
**Scope:** Signup phone field (local Nigerian only)

## Input constraints

| Rule | Implementation |
|------|----------------|
| Numbers only | `digitsOnlyPhoneLocal` on change |
| Max 11 digits | `.slice(0, 11)` + `maxLength={11}` |
| No letters / spaces / hyphens / `+` | Non-digits stripped; cannot remain in value |
| `inputMode` | `numeric` |
| Pattern | `[0-9]*` |

## Validity

`isLocalNigerianSignupPhone(input)`:

- Must match `/^\d{11}$/`
- Must pass `isValidNigerianPhone` (prefix `070` / `080` / `081` / `090` / `091`)

Stricter than legacy `isBasicPhoneFormat` (which also accepted 10-digit and intl forms).

## Valid examples

- `08031234567`
- `08120749537`
- `09012345678`
- `07034567890`
- `09151234567`

## Invalid examples

| Input | Why |
|-------|-----|
| 10 digits | Length ≠ 11 |
| 12+ digits | Capped / fails exact length |
| `+234…` / `234…` | Not local `0XXXXXXXXXX`; fails prefix after strip+cap |
| Spaces / hyphens | Rejected as raw; onChange strips so typed separators never stick |

## Errors

- Blur (when non-empty) or submit: **Enter a valid 11-digit Nigerian phone number.**
- Duplicate still: **Number already in use**

## Server

`POST /api/auth/signup` rejects non-local 11-digit Nigerian numbers with the same error string.
