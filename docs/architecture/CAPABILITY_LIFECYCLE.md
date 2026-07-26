# Capability Lifecycle Policy

**Status:** ACTIVE  
**Declared:** 2026-07-26  
**Authority:** Founder · [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md)

Every Yike capability (and plugin) progresses through defined stages. No undocumented half-features.

---

## Stages

| Stage | Meaning | Where it may run | Requirements |
|-------|---------|------------------|--------------|
| **1. Planned** | Documented intent only | Docs / backlog | Name, owner, contracts sketch, flag name reserved |
| **2. Experimental** | Dev-only / local | Development | Registers in YIP; tests optional but encouraged; **never** default-on in prod |
| **3. Beta** | Controlled testing | Staging + prod behind flag | Contract tests · health · diagnostics · feature flag · docs; founder/ops enable |
| **4. Production** | Stable and supported | Production | Full test gate · observability · activation report row · rollback path |
| **5. Deprecated** | Removal scheduled | Production (warn) | Migration guidance · sunset date · no new dependents |
| **6. Retired** | Removed from active use | Docs history only | Manifest retained in docs; code removed or stubbed; flag removed |

---

## Rules

1. **Unknown is forbidden.** Every capability appears in [PLATFORM_ACTIVATION_REPORT.md](../launch/PLATFORM_ACTIVATION_REPORT.md) with a stage.
2. **Stage upgrades are intentional.** Experimental → Beta → Production requires tests + health + docs updates.
3. **Flags gate exposure**, not existence. Beta/Production capabilities may still ship with UI off (`ENABLE_*=false`).
4. **Providers follow the same lifecycle** under their capability (e.g. Paystack under Payment).
5. **Deprecation is a stage**, not a silent delete. Give dependents a migration path.
6. **Constitution Rule #1 applies:** new capabilities — not new infrastructure — advance through this ladder.

---

## Manifest expectations (by stage)

| | Planned | Experimental | Beta | Production |
|-|---------|--------------|------|------------|
| Doc entry | ✓ | ✓ | ✓ | ✓ |
| YIP registration | | ✓ | ✓ | ✓ |
| Feature flag | reserved | ✓ | ✓ | ✓ |
| Health / diagnostics | | preferred | ✓ | ✓ |
| Contract tests | | preferred | ✓ | ✓ |
| Activation report | ✓ | ✓ | ✓ | ✓ |

---

## Related

- [ENTERPRISE_ACTIVATION_PROGRAM.md](../launch/ENTERPRISE_ACTIVATION_PROGRAM.md)  
- [ACTIVATION_GROUPS.md](../launch/ACTIVATION_GROUPS.md)  
- [YIP_PLUGIN_ARCHITECTURE.md](./YIP_PLUGIN_ARCHITECTURE.md) · [YIP_RUNTIME.md](./YIP_RUNTIME.md)
