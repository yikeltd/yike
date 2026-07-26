# Final Launch Sprint Audit — 2026-07-26

**Phase:** Launch Operations · Feature Freeze ACTIVE  
**Command Center:** [LAUNCH_COMMAND_CENTER.md](./LAUNCH_COMMAND_CENTER.md)  
**Method:** Live probes against https://yike.ng + anon Supabase REST counts + repo runbooks  
**Eng code changes this sprint:** None (no Critical/High eng defects found)

---

## Verdict

| Area | Result | Class |
|------|--------|-------|
| Public marketplace routes | PASS | READY |
| Auth surfaces | PASS (pages 200; OTP diagnostics OK) | READY |
| Search / listing detail | PASS (~0.8–1.2s) | READY |
| Admin / staff APIs | PASS (401 unauthenticated) | READY |
| Public health | PASS `/api/public-health` 200 JSON | READY |
| Security headers | PASS (HSTS, CSP, XFO, nosniff) | READY |
| SSL | PASS (CN=yike.ng · valid → 2026-10-18) | READY |
| Media protection live smoke | FAIL — `media_assets=0` | FOUNDER |
| Marketplace supply | FAIL — 32 approved, all sample-tagged | FOUNDER |
| Vehicles gate | WARN — `/vehicles` live 200 | FOUNDER (C11) |
| Backups restore drill | UNVERIFIED (runbook exists) | FOUNDER/OPS |
| Staging load validation | NOT RUN (catalog ready; DB not seeded) | OPS |
| Leaked-password Auth | UNVERIFIED (Dashboard) | FOUNDER (C08) |

**Engineering launch-safe:** ~90%  
**Overall launch readiness:** ~74%  
**GO / NO-GO:** **NO-GO**

---

## 1. Production route audit

| Route | HTTP | Latency (s) | Notes |
|-------|-----:|------------:|-------|
| `/` | 200 | 1.51 | OK |
| `/search` | 200 | 1.21 | OK |
| `/search?city=Lagos` | 200 | 0.97 | OK |
| `/search?q=apartment` | 200 | 1.11 | OK |
| `/auth/signup` | 200 | 0.83 | OK |
| `/auth/login` | 200 | 0.77 | OK |
| `/privacy` `/terms` `/cookies` `/safety` `/moderation` `/contact` | 200 | ~1.0 | OK |
| `/profile` `/dashboard` `/sell` `/post-property` | 200 | ~1.0–1.4 | OK |
| `/buy` `/rent` `/land` `/discover` `/saved` `/about` `/verify-agent` | 200 | 0.9–2.4 | `/rent` `/land` slowest |
| `/properties/{slug}` (2 samples) | 200 | 1.04–1.16 | OK |
| `/vehicles` | 200 | 0.85 | Still exposed (flag likely ON in Coolify) |
| `/lex` `/lex/auth` | 200 | ~0.8–1.0 | Login shell |
| `/api/public-health` | 200 | 0.49–0.61 | JSON health |
| `/api/admin/env-health` | 401 | 0.51 | Auth gate OK |
| `/api/admin/media/assets` | 401 | 0.52 | Auth gate OK |
| `/api/health/notifications` | 401 | 0.53 | Auth gate OK |
| `/api/health` (bare) | 200 HTML | — | Not JSON; use `/api/public-health` |

### Public health diagnostics (live)

```json
{
  "status": "ok",
  "application": "yike",
  "environment": "production",
  "platform": "coolify",
  "provider": "hetzner",
  "diagnostics": {
    "signupReady": true,
    "emailOtpEnabled": true,
    "yikeOtpServerToken": true,
    "supabaseServiceRole": true,
    "otpDbClient": true
  }
}
```

---

## 2. Inventory (production DB via anon REST)

| Metric | Value |
|--------|------:|
| Listings visible (approved) | **32** |
| Sample/demo tagged | **32 / 32** |
| Pending (anon-visible) | **0** (pending may exist but RLS-hidden — expected) |
| Vehicle-ish (`auto_category` set) | **14** |
| `media_assets` rows | **0** |

**Cities present:** Lagos, Abuja, Port Harcourt, Enugu, Uyo, Owerri, Aba, Asaba, Benin City, Umuahia, Yola, Calabar  

**Note:** Soft-launch inventory is 100% sample seed, not real vendors.

---

## 3. Media protection

| Check | Status |
|-------|--------|
| Code + migration deployed | READY (prior ship) |
| Admin API auth gate | PASS (401) |
| Live registry row | **FAIL** (`media_assets=0`) |
| PRODUCTION VERIFIED | **No** — awaiting founder smoke |

Guide: [MEDIA_PROTECTION_PRODUCTION_SMOKE.md](./MEDIA_PROTECTION_PRODUCTION_SMOKE.md)

---

## 4. Staging validation

| Item | Status |
|------|--------|
| Idempotent catalog | READY (~300 props / ~134 vehicles / 12 sellers) |
| Applied to sandbox DB | **Not done** this sprint |
| Search/perf on large set | **Blocked** until `npm run seed:demo` against sandbox |

Report: [STAGING_VALIDATION_REPORT_2026-07-26.md](./STAGING_VALIDATION_REPORT_2026-07-26.md)

---

## 5. Production operations

| Check | Evidence | Status |
|-------|----------|--------|
| Deploy live | public-health + pages 200 | PASS |
| Rollback runbook | [ROLLBACK.md](./ROLLBACK.md) | DOC READY · drill ☐ |
| Backup/restore runbook | [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) | DOC READY · drill ☐ |
| SSL | Valid to 2026-10-18 | PASS |
| Storage posture | Archive private (prior audit) | PASS (reconfirm in Coolify/Supabase monthly) |
| Monitoring | `global-error` + public-health; no Sentry | ACCEPTABLE for soft-launch |
| Cron | Not re-probed without Coolify UI | FOUNDER/OPS ☐ |

---

## 6. Security re-check

| Check | Result |
|-------|--------|
| Admin APIs without session | 401 | PASS |
| Security headers | HSTS + CSP + XFO + nosniff + Referrer-Policy | PASS |
| Anon cannot see pending via status filter | pending counts 0 | PASS (RLS) |
| Service role not in client `.env.local` | Only public keys locally | PASS |
| Leaked-password protection | Dashboard still required | OPEN C08 |
| Privilege escalation via seed | Prod seed refused without allow flag | PASS |

No Critical/High eng privilege bugs found this sprint → **no code fix shipped**.

---

## 7. Defects / disposition

| ID | Issue | Severity | Disposition |
|----|-------|----------|-------------|
| D1 | Thin / sample-only inventory (32) | Critical (trust) | FOUNDER supply — C04 |
| D2 | `media_assets=0` | High (trust/ops) | FOUNDER smoke — C12 |
| D3 | Leaked-password OFF | High | FOUNDER Auth — C08 |
| D4 | `/vehicles` still live | Medium | FOUNDER Coolify — C11 |
| D5 | Backup restore unproven | Medium | FOUNDER/OPS drill |
| D6 | `/rent` `/land` ~2.2–2.4s | Low | V2 backlog (perf) |
| D7 | Bare `/api/health` HTML | Low | V2 — use `/api/public-health` |
| D8 | No vendor crash monitoring | Low/Med | V2 optional Sentry |

---

## 8. Eng remaining (critical)

**~0 hours** of mandatory eng code. Remaining work is founder + ops + business supply.
