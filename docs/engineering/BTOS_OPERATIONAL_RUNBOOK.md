# Yike BTOS — Operational Runbook & Production Playbook (Milestone 8)

## 1. Subsystem Architecture Overview
The Business Transaction Operating System (BTOS) decouples 12 business domains using an event-driven architecture, double-entry ledger, Redis Streams durable event transport, and CQRS read projections.

| Layer | Component | Production Implementation |
|---|---|---|
| **Persistence** | PostgreSQL / Supabase | `public.btos_*` domain tables with RLS & versioning |
| **Event Stream** | Redis Streams | `RedisStreamEventAdapter` with DLQ & exponential backoff |
| **Orchestration**| TransactionSagaManager | Multi-domain sagas with compensating rollbacks & timeouts |
| **Read Models** | CQRS Projections | `btos_read_projections` JSONB materialized views |
| **Observability**| Tracing & Telemetry | `BTOSTracer` span tracing & `BTOSMetrics` latency histograms |
| **Security** | RBAC & Cryptography | `BTOSSecurityManager` & Paystack HMAC-SHA512 verification |

---

## 2. Disaster Recovery Playbook

### Scenario 1: Redis Stream Connection Lost
1. App falls back gracefully to in-memory event dispatching.
2. Once Redis connection restores, run `redisStreamAdapter.replayStream()` to re-sync event logs.

### Scenario 2: CQRS Read Projection Stale / Desynchronized
1. Execute projection rebuild script:
   ```bash
   node scripts/rebuild-cqrs-projections.mjs
   ```
2. Engine re-queries event streams and updates `btos_read_projections` without modifying transactional source tables.

### Scenario 3: Secret & Webhook Key Rotation
1. Update `PAYSTACK_SECRET_KEY` / `SAFEHAVEN_CLIENT_SECRET` in Coolify Environment Variables.
2. Webhook verification automatically validates against active secret without service downtime.

---

## 3. Operational Health Monitoring
- Deep Health Check Endpoint: `GET /api/health/full`
- Checks memory heap, DB connections, integration audit, and active subscriptions.
