# PIN Validation Report

**Status:** Ready for founder review — **no commit**  
**Shared module:** `src/lib/pin-policy.ts` (client + server)

## Rules (enforcement only — not shown to users)

1. Exactly **6 numeric digits**
2. Reject **full** ascending / descending runs (`123456`, `654321`, `987654`, …)
3. Reject **six identical** digits (`111111` … `000000`)
4. Reject common / repeating structures:
   - Denylist (e.g. `121212`, `123123`, `112233`, `445566`, `654654`, `135790`, `246810`)
   - Patterns: `ABABAB`, `ABCABC`, `AABBCC`

## Allowed examples

| PIN | Result |
|-----|--------|
| `212523` | Allowed |
| `918274` | Allowed |
| `473829` | Allowed |
| `605182` | Allowed |

## Rejected examples

| PIN | Result | User message |
|-----|--------|--------------|
| `123456` / `654321` / `987654` | Rejected | Choose a less predictable PIN for better security. |
| `111111` / `000000` | Rejected | Same generic message |
| `121212` / `123123` / `112233` | Rejected | Same generic message |

## UX helper (signup only)

- Not shown initially
- On first digit: fade in “Use a 6-digit PIN you'll remember.”
- At exactly 6 digits: hide helper
- If cleared or edited below 6: helper returns

## Checklist component

`PinChecklist` updated to soft labels (“Exactly 6 digits”, “Not easy to guess”) so it does not leak detection rules. Currently unused in signup UI.

## Regression note

Previous policy required “≥3 distinct digits”, “≤2 of same digit”, and “no 3-in-a-row”. That incorrectly blocked random-like PINs such as `212523`. Replaced with weak-pattern detection above.
