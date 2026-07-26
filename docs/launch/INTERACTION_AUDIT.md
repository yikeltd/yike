# Interaction Audit — Dead Tap Elimination

**Date:** 2026-07-26  
**Severity:** P0 launch blocker (Account → Edit Profile dead tap)  
**Status:** Fixed in code; founder FAT checklist below

---

## Root cause

`ProfileAccountActions` set:

```ts
editProfileHref = canList ? "/agent/profile-setup" : "/agent"
```

| User | Href | Result |
|------|------|--------|
| Buyer / non-lister | `/agent` | Same page → **no visible navigation** |
| Seller with complete profile | `/agent/profile-setup` | Server **redirects away** (already “complete”) |

The row looked interactive (chevron + pressable styles) but did nothing useful.

---

## Fix

1. **New route** `/agent/edit-profile` — any signed-in user; never redirects on “complete”.
2. **Edit Profile** always links to `/agent/edit-profile`.
3. Page includes **AvatarUpload** + **BasicProfileForm** (name, DOB, phone, address, city, state; business fields when applicable).
4. Save → `/agent?saved=profile` with success banner.
5. **QuickAction** no longer falls back to `href="#"` (returns `null` if neither `href` nor `onClick`).
6. **SettingsRow** without `href`/`onClick` renders non-interactive “Soon” (not a dead button).
7. Trust Center “Personal details” / “Profile photo” Continue links go to `/agent/edit-profile` (not profile-setup bounce / hash-only).

---

## Account screen (`/agent`)

| Control | Action | Status |
|---------|--------|--------|
| Cover / avatar (hero) | Upload via cover + `#profile-photo` editors | OK |
| List on Yike | `/agent/listings/choose` or `/agent/become` | OK |
| My listings | `/agent/listings` | OK |
| Leads | `/agent/leads` | OK |
| Notifications | `/agent/notifications` | OK |
| Followers | `/agent/followers` | OK |
| Get Help / Help | WhatsApp support | OK |
| Company | `/agent/company` (when agency/developer) | OK |
| Saved | `/saved` | OK |
| Browse | `/search` | OK |
| Verify | `/property-verification` | OK |
| Trust Continue | `/agent/verification` or `/agent/edit-profile` | OK |
| **Edit Profile** | **`/agent/edit-profile`** | **Fixed** |
| Change Password | Expands inline form | OK |
| Change Email | Expands inline form + OTP | OK |
| Advanced → Delete Account | Modal → `/account/delete` | OK |
| Help Center | `/safety` | OK |
| Contact Support | WhatsApp | OK |
| Log out | `signOut("/")` | OK |

---

## Edit Profile (`/agent/edit-profile`)

| Field | Supported |
|-------|-----------|
| Profile photo | Yes (`AvatarUpload` → `/api/profile/avatar`) |
| Full name / contact name | Yes |
| Date of birth | Yes (individual) |
| Phone / WhatsApp | Yes |
| Address, area, city, state | Yes |
| Company + CAC (business) | Yes |
| Email change | Via Account → Change Email (sensitive gate) |
| Cover photo | Account hero (existing) |
| Bio / occupation / public visibility | Not in current profile edit API — **omitted** (no dead UI) |

---

## Consumer surfaces (code + route audit)

Code/route review for dead `href="#"` / no-op buttons on primary launch paths. Manual FAT still required on device.

| Screen | Interactive elements reviewed | Dead taps found |
|--------|-------------------------------|-----------------|
| Home (`/`) | Category toggle, search entry, city chips, feed cards, bottom nav | None in code path |
| Search (`/search`) | Filters, results, cards | None flagged |
| Listing detail | Gallery, WhatsApp CTA, save, share | None flagged |
| Swipe / Discover | Deck actions | None flagged |
| Saved (`/saved`) | List + empty CTA | None flagged |
| Auth login / signup / OTP | Forms + CTAs | None flagged |
| Bottom nav | Home · Swipe · Search · Saved · Profile | Routes exist |
| Safety / Help (`/safety`) | Content + support | Linked from Account |
| Seller verification | `/agent/verification` | Linked from Trust Center |
| Become / List flow | `/agent/become`, choose listing | Linked from Account CTA |

**Guardrails shipped**

- No `href="#"` QuickActions.
- Settings rows must navigate, expand, or show non-interactive “Soon”.

---

## Founder FAT checklist

- [ ] Sign in as buyer → Account → Edit Profile → form loads → save → “Profile saved.”
- [ ] Sign in as seller with complete profile → Edit Profile still opens (does not bounce).
- [ ] Change avatar on edit page.
- [ ] Change password / email expand and submit.
- [ ] Help Center + Contact Support respond.
- [ ] Log out works.
- [ ] Bottom nav: every tab opens a real screen.
- [ ] Listing card → detail → WhatsApp CTA opens.
- [ ] No console errors on Account + Edit Profile.

---

## Files changed

| File | Change |
|------|--------|
| `src/app/agent/edit-profile/page.tsx` | New edit destination |
| `src/components/profile/profile-account-actions.tsx` | Always link to edit-profile; safer SettingsRow |
| `src/components/profile/profile-page-client.tsx` | QuickAction null guard; saved banner |
| `src/app/agent/page.tsx` | Pass `saved=profile` banner |
| `src/lib/verification/trust-center.ts` | Edit-profile destinations |
| `docs/launch/INTERACTION_AUDIT.md` | This audit |
