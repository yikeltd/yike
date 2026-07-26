# Yike Enterprise Activation Program

**Status:** ACTIVE — founder-approved final platform instruction before launch  
**Declared:** 2026-07-26  
**Authority:** Founder  

**Not a feature sprint. Not a bug week.** An enterprise-wide activation program.

| Companion | Role |
|-----------|------|
| [PLATFORM_CONSTITUTION.md](../architecture/PLATFORM_CONSTITUTION.md) | Architecture frozen — capabilities only |
| [CAPABILITY_LIFECYCLE.md](../architecture/CAPABILITY_LIFECYCLE.md) | Planned → Experimental → Beta → Production → Deprecated → Retired |
| [ACTIVATION_GROUPS.md](./ACTIVATION_GROUPS.md) | 🟢 Must-ready · 🟡 Build/hide · 🔵 Plugins · 🔴 Future products |
| [PLATFORM_ACTIVATION_REPORT.md](./PLATFORM_ACTIVATION_REPORT.md) | Living certification scorecard |
| [FEATURE_FREEZE.md](./FEATURE_FREEZE.md) | Merge gate — activation work is an explicit founder override |
| [LAUNCH_COMMAND_CENTER.md](./LAUNCH_COMMAND_CENTER.md) | Daily ops until Command Center expands |

---

## Mission

Architectural foundation is **complete**:

- Metadata Listing Engine  
- YIP · Capability Runtime · Plugin Architecture · Registry · Event Bus · Knowledge Layer · Provider Architecture  

**Objective is no longer to build infrastructure.**

**Objective:** activate, integrate, validate, and certify every core capability required for launch — while preparing future capabilities as **plugins behind feature flags**.

Every surface must be one of:

| State | Meaning |
|-------|---------|
| **Production Ready** | Certified for launch |
| **Feature Flagged** | Implemented; UI/provider off until enabled |
| **Disabled** | Documented reason in activation report |

Nothing may remain in an **unknown** state.

---

## Non-negotiable rules

1. **Do not build another infrastructure layer.** YIP Runtime is permanent. See constitution.
2. **Do not bypass** YIP · Capability Runtime · Registry · Event Bus · Plugin System · Knowledge Layer.
3. **Every future capability is a plugin** (or a thin UI over one). Never hardcode new business logic into apps.
4. **Every capability exposes:** Health · Diagnostics · Configuration · Feature Flag · Tests · Documentation.
5. **Do not turn everything on.** Enable Group 1 first; Group 2 ships dark; Groups 3–4 stay plugins/planned.

---

## How to execute (systematic)

```
Phase 0   Security blockers (PIN pepper, secrets)     ← first
Phase 1   Core platform certification (YIP health)
Phases 2–10  Capability activation (Payment → Media)
Phase 11  Enterprise Operations Center (expand Launch Health)
Phase 12  Feature flags (config-only enable)
Phase 13  Observability
Phase 14  Security audit close-out
Phase 15  Testing gate
Phase 16  Documentation + PLATFORM_ACTIVATION_REPORT
```

Work **one phase (or one capability) at a time**. Prefer lifecycle stage upgrades over greenfield subsystems.

---

## Phase 0 — Security blockers (do first)

| Item | Action |
|------|--------|
| `YIKE_PIN_PEPPER` | **Must be set in Coolify production** (≥32 chars). Launch Health / env-health already checks presence. No launch until configured. |
| Secrets validation | Confirm service role, Resend, Paystack webhook secret, OTP tokens |
| PIN hash paths | Service-role only (already hardened) |

---

## Phase 1 — Core platform certification

Audit every registered capability / plugin for:

Registration · Initialization · Dependency resolution · Permissions · Configuration · Provider resolution · Health · Diagnostics · Shutdown · Recovery · Failure handling  

**Exit:** No unknown plugins; runtime `diagnostics()` clean; failures documented.

---

## Phase 2 — Payment Capability (launch-critical)

**Do not** let app code talk to Paystack directly long-term.

```
Payment Capability → Provider → Paystack | Flutterwave | Moniepoint | Stripe | Bank | Wallet
```

Implement / certify:

- Init · verify · webhooks · retry · failed payments · duplicate protection  
- Audit trail · settlement records · refund framework  
- Health · metrics · diagnostics  
- Flag: `ENABLE_PAYMENTS` / existing `ENABLE_FEATURED_PAYMENTS` until unified  

Scope: listing promotions, featured listings, reconciliation in Lex.

---

## Phase 3 — Wallet Capability

Financial ledger (not a consumer “bank app” at launch):

Credits · refunds · promo credits · future escrow/commissions · bonuses · adjustments · history · audit  

Flag: `ENABLE_WALLET` — **recommend enable for launch** (ledger on; heavy UI may stay light).

---

## Phase 4 — Settlement Capability (Escrow)

**Not** “Escrow as business spaghetti.” Settlement Capability with providers: Internal · Law Firm · Bank · Third Party.

Flag: `ENABLE_ESCROW` — **UI hidden** until founder enables.

---

## Phase 5 — Financing Capability

Interfaces + placeholder providers for: Mortgage · Auto loan · Lease · Installments · BNPL · Investor financing.

Flag: `ENABLE_FINANCING` (UI hidden). Related: `ENABLE_MORTGAGE` for mortgage-specific UI.

---

## Phase 6 — Protection Capability

Insurance · Warranty · Buyer/Seller protection · future claims.

Flag: `ENABLE_PROTECTION` / `ENABLE_INSURANCE` (UI hidden).

---

## Phase 7 — Verification Capability

Identity · Business · CAC · BVN · NIN · Driver license · Property title · Dealer · Passport · Trust grade — as **providers/plugins**.

Flag: `ENABLE_VERIFICATION` · `ENABLE_PASSPORT` · `ENABLE_NATIONAL_REGISTRY` (UI hidden where required).

---

## Phase 8 — Trust Capability (backend)

Engine calculates (expose via YIP; unfinished Trust Economy UI stays off):

Seller score · Listing quality · Verification score · Photo quality · Completion % · Response rate · Reputation · Fraud confidence · Moderation confidence · Device trust · Risk score  

---

## Phase 9 — Search Capability

Autocomplete · typo tolerance · ranking · recent · popular · saved · future semantic/AI search.

---

## Phase 10 — Media Capability

Already strong. Add/certify: duplicate image detection · video upload preparation · blur detection · future OCR/CV.

---

## Phase 11 — Enterprise Operations Center

Evolve Launch Health (`/lex/auth/health`) into capability/runtime health:

Platform Runtime · Plugin Host · Registry · Knowledge · Recommendation · Pricing · Trust · Media · Workflow · Rules · Events · Payments · Wallet · Escrow · Verification · Search · Notifications · Analytics · Cache · Cron · Storage · Database · Provider/Plugin/Runtime health  

Each reports: Healthy | Warning | Critical · Latency · Version · Provider · Errors · Last check.

---

## Phase 12 — Feature flags

Config-only enable (no deploy required when possible):

`ENABLE_PAYMENTS` · `ENABLE_WALLET` · `ENABLE_ESCROW` · `ENABLE_FINANCING` · `ENABLE_PROTECTION` · `ENABLE_VERIFICATION` · `ENABLE_PASSPORT` · `ENABLE_MORTGAGE` · `ENABLE_INSURANCE` · `ENABLE_VEHICLE_HISTORY` · `ENABLE_VIN` · `ENABLE_OCR` · `ENABLE_VALUATION` · `ENABLE_NEIGHBORHOOD` · `ENABLE_AI_ASSIST` · `ENABLE_COMMAND_CENTER` · `ENABLE_DEVELOPER_API` · `ENABLE_NATIONAL_REGISTRY` · …

Wire through `src/lib/launch-mode/` / YIP config — not ad-hoc `if (process.env)` sprawl.

---

## Phases 13–16

| Phase | Deliverable |
|-------|-------------|
| 13 Observability | Health · metrics · diagnostics · logs · version · deps · provider · flag · latency · failures · recovery |
| 14 Security | PIN pepper · secrets · permissions · plugin isolation · payment/webhook security |
| 15 Testing | Unit · integration · contract · provider · failure · recovery · health · config · regression |
| 16 Docs | Update architecture + launch docs; maintain [PLATFORM_ACTIVATION_REPORT.md](./PLATFORM_ACTIVATION_REPORT.md) |

---

## Success criteria

- [ ] All Group 1 capabilities operational or explicitly certified with residual risk  
- [ ] Group 2 implemented as plugins/interfaces; UI flagged off  
- [ ] Group 3 registered (many disabled)  
- [ ] Group 4 not built into marketplace core  
- [ ] Every capability through YIP; no direct provider calls outside Integration Layer  
- [ ] Feature flags functional  
- [ ] Ops Center reflects true platform health  
- [ ] Security audit passes (`YIKE_PIN_PEPPER` set)  
- [ ] Payment · Wallet · Verification · Trust · Search · Media certified per lifecycle  
- [ ] Tests green for activated capabilities  
- [ ] Activation report published  

Then remaining work is **business execution**: inventory, real workflows, FAT — not foundational rewrites.

---

## Agent / engineer protocol

1. Read constitution + this program + lifecycle before coding.  
2. Prefer upgrading an existing capability’s lifecycle stage over new packages.  
3. If tempted to add a bus/runtime/registry → **stop** — write a design proposal.  
4. After each capability activation: update `PLATFORM_ACTIVATION_REPORT.md` and Launch Health checks when applicable.  
5. Launch feature freeze still blocks random UI; **this program is the approved path** for capability activation work.
