# Yike Launch Command Center

**Phase:** Launch Operations (not development)  
**Feature freeze:** [ACTIVE](./FEATURE_FREEZE.md)  
**Prod:** https://yike.ng · Coolify · Supabase `hlpojfurfldvcxfxhveg`  
**Last updated:** 2026-07-26  
**Owner:** Founder + ops

> **Single source of truth until launch.** Update this document daily. Do not scatter status across chat threads.

---

## 1. Overall launch status

| Area | Status |
|------|--------|
| Core Marketplace | ✅ Ready |
| Authentication | ✅ Ready (SMS isolated / deferred) |
| Listings | ✅ Ready |
| Property | ✅ Ready |
| Vehicles | ✅ Ready (feature-gated OFF until supply) |
| Search | ✅ Ready |
| Profiles | ✅ Ready |
| Admin (Lex) | ✅ Ready |
| Media Protection | ✅ Production |
| Security | ✅ Production (leaked-password still founder action) |
| Infrastructure | ✅ Production |
| Documentation | ✅ Comprehensive |
| Feature Development | 🛑 Frozen |
| Launch Operations | 🚀 Active |

**Headline Go / No-Go:** `NO-GO` — waiting on live inventory + founder ops sign-offs (see §8).

---

## 2. Launch countdown

| Field | Value |
|-------|--------|
| Target soft-launch window | _TBD by founder_ |
| Days remaining | _update daily_ |
| Public marketing push | After ≥2 weeks stable supply (per readiness audit) |
| Freeze start | 2026-07-26 |

---

## 3. Five workstreams

### WS1 — Marketplace supply (highest priority)

Without inventory, a perfect platform feels empty.

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| Active property listings (approved) | 250+ | _count_ | Lex Auth → listings |
| Active vehicle listings | 150+ | 0 / gated | Only if `ENABLE_VEHICLE_MARKETPLACE=true` + supply |
| Verified agents | 25+ | _count_ | |
| Estate agencies | _target_ | _count_ | |
| Independent agents | _target_ | _count_ | |
| Developers | _target_ | _count_ | |
| Dealerships | _target_ | _count_ | |
| Individual sellers | _target_ | _count_ | |
| Geo coverage | Lagos, Abuja, PH, Enugu, Ibadan, Kano, Benin, Owerri, Asaba, Uyo | _list live cities_ | Soft-launch may start with 1–2 cities if honest framing |

**Daily supply actions:** recruit · verify · approve queue · freshness · remove fakes.

---

### WS2 — Production operations

**Daily checklist** (tick each day):

| Check | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-------|-----|-----|-----|-----|-----|-----|-----|
| Coolify latest deploy Ready | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| https://yike.ng responds 200 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Server / container health | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Storage capacity OK | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| DB health / advisors skim | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Backups verified (weekly OK) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| SSL valid | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Error logs skimmed | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Monitoring / alerts quiet | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

**Buckets:** `property-media` public · `listing-media-archive` private · `profile-images` as configured.

---

### WS3 — Trust & safety (operate, don’t build)

| Queue | Owner | Cadence | Status |
|-------|-------|---------|--------|
| Listing reports | Lex Auth | Daily | ☐ |
| Fake / scam listings | Lex Auth | Daily | ☐ |
| Duplicate / stolen media signals | Tech (manual until V2) | As needed | Fingerprints live; auto-queue is V2 |
| Verification requests | Lex Auth | Daily | ☐ |
| Fraud / abuse reports | Support + Auth | Daily | ☐ |
| Media protection anomalies | Tech | Weekly | Lex → Uploads & Protection |

Primary moderation path: `/lex/auth` (not support as primary).

---

### WS4 — Quality assurance

**Full journey** (repeat until clean):

Guest → Register → Verify (email) → Profile → Upload listing → Publish → Search → Open listing → Contact (WhatsApp) → Admin moderate → Listing management

| Journey | Last run | Result | Blocker? |
|---------|----------|--------|----------|
| Guest browse / search | _date_ | ☐ Pass / ☐ Fail | |
| Signup / email OTP login | _date_ | ☐ Pass / ☐ Fail | |
| Seller upload + watermark | _date_ | ☐ Pass / ☐ Fail | |
| Buyer WA contact | _date_ | ☐ Pass / ☐ Fail | |
| Agent profile / storefront | _date_ | ☐ Pass / ☐ Fail | |
| Lex pending moderate | _date_ | ☐ Pass / ☐ Fail | |
| Save listing (auth + guest) | _date_ | ☐ Pass / ☐ Fail | |
| Mobile viewport | _date_ | ☐ Pass / ☐ Fail | |
| PWA / offline smoke | _date_ | ☐ Pass / ☐ Fail | |

**Defect log** (launch blocker vs post-launch):

| ID | Defect | Severity | Disposition |
|----|--------|----------|-------------|
| — | — | Critical / High / Medium / Low | Blocker / Post-launch |

---

### WS5 — Launch preparation (ops / legal / brand)

| Item | Status |
|------|--------|
| Privacy Policy | ☐ Verify live `/privacy` |
| Terms of Service | ☐ Verify live `/terms` |
| Cookie Policy | ☐ Verify live `/cookies` |
| Community / moderation guidelines | ☐ `/moderation` + safety |
| Help / FAQ | ☐ |
| Contact & support | ☐ `/contact` |
| Social profiles | ☐ |
| Play Store / TWA assets | ☐ If shipping app shell |
| Press kit | ☐ |
| Brand assets | ☐ Logo / OG |
| Analytics dashboards | ☐ (WA funnel KPIs; crash monitoring still gap) |

---

## 4. Critical blockers (open only)

| ID | Item | Owner | Status |
|----|------|-------|--------|
| C04 | Live supply / honest soft-launch framing | Founder | OPEN |
| C07 | Rotate OTP token / Sendchamp if exposed | Founder | OPEN |
| C08 | Enable Auth leaked-password protection | Founder | OPEN |
| — | Crash monitoring (Sentry or equiv.) | Eng | OPEN (Medium — polish) |
| — | CI lint green | Eng | OPEN (non-blocking Coolify) |

Closed recently: security migrations, profile column lock, media ownership, media protection, vehicles default OFF, webhooks Link.

SMS OTP: **DEFERRED** as launch blocker (browse-first / email OTP). Keep WIP off `main` until proven.

---

## 5. Infrastructure health (snapshot)

| System | Status | Notes |
|--------|--------|-------|
| Coolify / Hetzner | ✅ | Deploys from `main` |
| Cloudflare / TLS | ✅ | Confirm daily |
| Supabase prod | ✅ | `hlpojfurfldvcxfxhveg` |
| Media protection | ✅ | Flag default ON |
| Paystack featured | ⏸ | Flagged off |
| Vehicles marketplace | ⏸ | `ENABLE_VEHICLE_MARKETPLACE=false` |
| SMS Sendchamp | ⏸ | Isolated workstream |
| Monitoring / Sentry | ⚠ | Not yet production-grade |

---

## 6. Known risks

1. Empty or thin inventory destroys trust faster than missing features.  
2. SMS delivery unproven — do not gate browse/signup on phone.  
3. GH Actions often red on lint — Coolify still deploys; fix after blockers.  
4. Upload latency +~0.5–2s with media protection — watch Coolify CPU under load.  
5. No crash monitoring yet — Lex audit logs ≠ runtime crashes.  
6. Soft-launch cities vs national SEO hubs — keep messaging honest.

---

## 7. Definition of Launch Ready

Launch when **all** are true (not when “features are done”):

- [ ] Platform is stable (no Critical/High open eng blockers)
- [ ] Real inventory exists and buyers can find attractive listings
- [ ] Sellers can successfully publish end-to-end
- [ ] Admins can moderate effectively
- [ ] Backups have been tested
- [ ] Monitoring is active (minimum: deploy health + error visibility)
- [ ] Media protection verified on a live listing photo
- [ ] Security audit items for launch are complete (incl. C07/C08 or accepted risk)
- [ ] No Critical or High launch blockers remain

---

## 8. Go / No-Go decision

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-26 | **NO-GO** | Feature complete enough; inventory + founder secret/auth actions + full smoke not signed off |

Update this table when the decision flips.

---

## 9. Launch sign-off checklist

| Role | Sign-off | Date | Initials |
|------|----------|------|----------|
| Founder — supply & positioning | ☐ | | |
| Founder — secrets / Auth settings (C07/C08) | ☐ | | |
| Ops — Coolify / backups / SSL | ☐ | | |
| Trust — moderation runbook ready | ☐ | | |
| Eng — smoke journeys green | ☐ | | |
| Eng — media protection live smoke | ☐ | | |

---

## 10. Daily update template

Copy into the top of §1 or a dated note below when updating:

```
### Daily log — YYYY-MM-DD
- Supply: properties=N vehicles=N agents=N cities=…
- Ops: Coolify= / errors=
- Trust: reports open= / moderated=
- QA: journeys run= / blockers filed=
- Decision: still NO-GO / soft-launch candidate because …
```

### Daily log — 2026-07-26

- Supply: needs founder push (C04)
- Ops: Coolify serving media protection API (401 unauth gate confirmed)
- Trust: media protection production; stolen-image auto-queue is V2
- QA: founder live listing photo smoke still needed
- Decision: **NO-GO** — Launch Operations Phase active; feature freeze on

---

## Related docs

| Doc | Role |
|-----|------|
| [FEATURE_FREEZE.md](./FEATURE_FREEZE.md) | Merge gate |
| [LAUNCH_WAR_ROOM_2026-07-26.md](./LAUNCH_WAR_ROOM_2026-07-26.md) | Critical / Polish / V2 board |
| [LAUNCH_READINESS_AUDIT_2026-07-26.md](./LAUNCH_READINESS_AUDIT_2026-07-26.md) | Founder audit |
| [../media/MEDIA_PROTECTION_LAUNCH_VERIFICATION.md](../media/MEDIA_PROTECTION_LAUNCH_VERIFICATION.md) | Media protection GO |
| [PROD_DB_SECURITY_VERIFY_2026-07-26.md](./PROD_DB_SECURITY_VERIFY_2026-07-26.md) | DB security verify |
| [README.md](./README.md) | Launch docs index |
