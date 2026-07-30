# Yike Business Transaction Operating System (BTOS) Architecture Manifest v1.0

## System Identity & Scope
- **Platform**: Yike.ng (Stankings Marketplace Platform)
- **Version**: BTOS Architecture v1.0 (Frozen Infrastructure Baseline)
- **Database**: Supabase PostgreSQL (`hlpojfurfldvcxfxhveg`)

---

## Architecture Topology

```text
                                  +-----------------------+
                                  |   Marketplace Web UI  |
                                  +-----------+-----------+
                                              |
                                  +-----------v-----------+
                                  |  BTOS API Gateway &   |
                                  |   RBAC Security Guard |
                                  +-----------+-----------+
                                              |
        +-------------------------------------+-------------------------------------+
        |                                     |                                     |
+-------v-------+                     +-------v-------+                     +-------v-------+
| Core Domain   |                     | Transaction   |                     | CQRS Read     |
| Aggregates    |                     | Saga Engine   |                     | Projections   |
+-------+-------+                     +-------+-------+                     +-------+-------+
        |                                     |                                     |
        |                             +-------v-------+                             |
        +-----------------------------> EventTransport <-----------------------------+
                                      +-------+-------+
                                              |
                                      +-------v-------+
                                      | Durable Stream|
                                      | Event Bus     |
                                      +---------------+
```

---

## Domain Boundary Catalog (12 Domains)
1. **Workspace Domain**: `src/lib/deal-room/core/workspace.ts`
2. **Negotiation Domain**: `src/lib/deal-room/negotiation/service.ts`
3. **Appointment Domain**: `src/lib/deal-room/appointment/service.ts`
4. **Trust Domain**: `src/lib/deal-room/trust/service.ts`
5. **Execution Domain**: `src/lib/deal-room/execution/service.ts`
6. **Collaboration Domain**: `src/lib/deal-room/collaboration/service.ts`
7. **Intelligence Domain**: `src/lib/deal-room/intelligence/service.ts`
8. **Settlement Domain**: `src/lib/deal-room/settlement/service.ts`
9. **Workflow Domain**: `src/lib/deal-room/workflow/service.ts`
10. **Evidence Vault Domain**: `src/lib/deal-room/evidence/service.ts`
11. **CQRS Projection Domain**: `src/lib/deal-room/cqrs/projections.ts`
12. **Lifecycle Domain**: `src/lib/deal-room/lifecycle/service.ts`

---

## Infrastructure Standards
- **Double-Entry Ledger**: `Sum(Debits) === Sum(Credits)` invariant on all monetary movements.
- **Durable Persistence**: Supabase PostgreSQL with RLS and automated migration strategy.
- **Saga Recovery Engine**: Automatic step checkpointing in `btos_sagas` table with LIFO compensation rollbacks.
- **Observability**: OpenTelemetry W3C Trace Context, Prometheus metrics export at `/api/metrics`, and Grafana / Tempo / Loki stack.
