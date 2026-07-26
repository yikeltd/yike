# Yike — Dashboard / Profile Header Handoff Audit

**Date:** 2026-07-26  
**Repo:** `yikeltd/yike` · Workspace: `/Users/stanlex/Documents/yike`  
**Production:** https://yike.ng (Coolify / Hetzner) · Deploy from `main`  
**Latest shipped commit:** `06bc3127` — *Ship executive profile header with clear cover and photo uploads.*

Use this document as context to continue work in another chat/agent.

---

## Product constraints (locked)

- Nigerian property/vehicles marketplace (Yike.ng)
- Brand palette **only:**
  - Navy `#031B4E` (`navy`) · navy-dark `#021428` · navy-mid `#052654` · navy-light `#0a2d6e`
  - Gold `#E4B547` · gold-dark `#c99a2e` · gold-light `#f5d878`
- Do **not** invent off-palette blues/creams for the profile card
- Launch mode: polish/trust — no escrow/chat/AI unless founder overrides
- Agent rule: commit + push to `origin/main` when work is done (unless told to hold)
- User rule: only commit when asked (founder said “deploy” last → shipped)

---

## What shipped in `06bc3127`

### Profile header (executive card)

| Zone | Behavior |
|------|----------|
| **Cover** | Full-bleed background only. Cover upload control (image icon) top-right. **Nothing else** overlaps cover. |
| **Identity row** | Below cover: **avatar \| name + @handle + Basic Verified \| Joined** |
| **Stats** | 3-column inset panel: Followers · Listing Likes · Verified Level |
| **Colors** | Tailwind tokens `navy` / `navy-mid` / `navy-light` / `gold` / `gold-light` |

### Uploads (working APIs; UI wired)

- **Cover:** `CoverUploadEditor` → `POST /api/profile/cover`
- **Avatar:** `AvatarUpload` camera button → `POST /api/profile/avatar`
- Labels “Background image” / “Profile photo” were **removed** (icons only + aria-labels)

### Social clicks

- Followers → `/agent/followers` (`/api/social/followers`)
- Listing Likes → `/agent/likes` (**new**) via `/api/social/listing-likers` + `getListingLikerProfiles()` in `src/lib/social/stats.ts`

### Dev preview

- Route: `/dev/dashboard-preview` (dev-only; `notFound()` in production)
- Path: `src/app/dev/dashboard-preview/page.tsx`  
  (**Moved** from `src/app/(public)/dev/...` because it conflicted with existing `src/app/dev/*`)

### Also in that commit

- Dashboard activity widgets + account actions polish
- Footer simplification touch-ups
- Plus Jakarta display font via `layout.tsx` / `--font-display`
- Large `globals.css` dashboard-live-card / profile-id leftovers

---

## Key files

```
src/components/profile/seller-profile-header.tsx   # main card layout
src/components/profile/profile-cover-hero.tsx       # wires AvatarUpload + CoverUploadEditor
src/components/profile/profile-page-client.tsx      # TrustChipBadge, verifiedLevel, showSocialStats
src/components/profile/profile-social-stats.tsx     # executive 3-col stats + links
src/components/profile/avatar-upload.tsx
src/components/profile/cover-upload-editor.tsx
src/app/api/profile/avatar/route.ts                # existing
src/app/api/profile/cover/route.ts                 # existing
src/app/agent/likes/page.tsx                       # new
src/app/api/social/listing-likers/route.ts         # new
src/lib/social/stats.ts                            # getListingLikerProfiles
src/app/dev/dashboard-preview/page.tsx             # local mock
```

Local preview: `npm run dev` → http://localhost:3000/dev/dashboard-preview  
Production test (auth): https://yike.ng/agent

---

## Layout decisions (founder approved)

1. Dark **navy** card (not cream, not mid-blue invent).
2. Cover must stay **uninterrupted** — no avatar overlap, no name on cover.
3. Avatar beside name/username/Basic Verified **below** cover.
4. Joined stays on the right of the identity row.
5. Stats stay clickable for people lists.

---

## Deploy / CI notes

- Pushed `main` → Coolify webhook redeployed (uptime reset observed).
- GitHub Actions **PR Checks** still **fails lint** on pre-existing issues (not introduced by this header work), e.g.:
  - `src/app/lex/tech/webhooks/page.tsx` — raw `<a>` vs `Link`
  - Other prefer-const / React Compiler lint noise on main
- Vercel status showed failure; **production is Coolify**, not Vercel.

---

## NOT shipped (still dirty locally)

Do **not** claim SMS OTP delivery is fixed. Leave these until founder asks:

```
M  .env.example
M  src/lib/notifications/providers/sendchamp*.ts
M  src/lib/otp/service.ts
M  src/lib/phone-verification/*
?? src/lib/otp/delivery-audit.ts
?? scripts/validate-sms-otp-delivery.mjs
?? docs/launch/OTP_*.md / SMS_OTP_*.md / SENDCHAMP_REQUEST_REPORT.md
?? docs/launch/screenshots/   # local UI screenshots only
```

OTP context: API accept ≠ carrier delivery; rotate any leaked Sendchamp key; see existing `docs/launch/SMS_OTP_*` reports.

---

## Suggested next work

1. **Upload UAT on prod** — signed-in `/agent`: cover + avatar upload, refresh, confirm persistence.
2. **CI hygiene** — fix `lex/tech/webhooks` Link lint (unblocks GH Actions).
3. **Empty cover vs body** — when no cover image, cover and navy body can look continuous; optional subtle cover placeholder/pattern within palette.
4. **Public agent profile** — `PublicSellerProfileHeader` uses same `SellerProfileHeader`; verify public page still looks right.
5. **OTP track** — separate commit only after founder green-light; do not mix with UI polish.

---

## Prompt starter for next session

```
Continue Yike (yikeltd/yike) from handoff audit docs/launch/DASHBOARD_PROFILE_HANDOFF_AUDIT.md.

Production is on Coolify from main @ 06bc3127. Profile header is executive navy/gold;
cover is clean; avatar+name sit below cover; uploads via existing /api/profile/avatar and /api/profile/cover.
Do not invent off-palette colors. OTP/Sendchamp WIP is uncommitted — leave alone unless asked.
Next: [state your task].
```
