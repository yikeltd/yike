# Production Verification Checklist — Yike

Run after every production deploy.

## Health

- [ ] `GET https://yike.ng/api/public-health` → 200
- [ ] Response includes application identity / commit when configured
- [ ] Coolify shows healthy container

## Consumer (Property — launch vertical)

- [ ] Home loads (`/`)
- [ ] Search (`/search`) returns results or empty state without error
- [ ] Listing detail opens (sample slug)
- [ ] WhatsApp CTA present on listing
- [ ] Saved / browse routes respond
- [ ] Auth: email OTP signup/login path works

## Trust / moderation (sample)

- [ ] Public safety / moderation pages load
- [ ] Staff can reach `/lex` with valid staff session (ops only)

## Negatives (expected)

- [ ] Vehicle marketplace UI remains absent (no `/vehicles` routes)
- [ ] `ENABLE_VEHICLE_MARKETPLACE` unset/false
- [ ] `isLaunchFeatureVisible('vehicle_marketplace')` is false when evaluated
  (registry exists; wire into route guards before any vehicle UI ships)
- [ ] No Passport UI (`passport_ui` / `ENABLE_PASSPORT_UI` false)
- [ ] No consumer escrow / wallet surfaces

## SEO / PWA smoke

- [ ] `/robots.txt` and `/sitemap.xml` respond
- [ ] `manifest.json` reachable
