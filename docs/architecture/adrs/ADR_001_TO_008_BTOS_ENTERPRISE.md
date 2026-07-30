# Yike BTOS — Architecture Decision Records (ADR 001 - 008)

## ADR 001: Supabase PostgreSQL Persistence for All Domain Aggregates
- **Status**: Accepted
- **Context**: Domain aggregates previously used in-memory repositories.
- **Decision**: Adopt Supabase PostgreSQL with dedicated tables and migration files (`supabase/migrations/`) for all 12 aggregates.

## ADR 002: Durable Event Stream Infrastructure with EventTransport Abstraction
- **Status**: Accepted
- **Context**: Decouple domain events from underlying transport implementations.
- **Decision**: Build `EventTransport` interface wrapping Redis Streams with exponential backoff and dead-letter queue.

## ADR 003: Saga Pattern Process Orchestration & Persistent Checkpoints
- **Status**: Accepted
- **Context**: Long-running transactions span multiple independent domain aggregates.
- **Decision**: Implement `TransactionSagaManager` with LIFO compensating rollbacks and `btos_sagas` step checkpoint persistence.

## ADR 004: CQRS Read Model Separation & ProjectionEngine
- **Status**: Accepted
- **Context**: Complex dashboard reads require assembling data across multiple domain aggregates.
- **Decision**: Separate write models from read models using `ProjectionEngine` and materialized projection tables.

## ADR 005: W3C OpenTelemetry Trace Context & Structured Telemetry
- **Status**: Accepted
- **Context**: Need vendor-neutral distributed tracing across HTTP, queues, and sagas.
- **Decision**: Adopt W3C Trace Context (`traceparent`) with `BTOSOpenTelemetryTracer`.

## ADR 006: Enterprise Security, RBAC Guards, & Webhook Signatures
- **Status**: Accepted
- **Context**: Secure financial escrow operations against unauthorized access and replay attacks.
- **Decision**: Implement domain-level RBAC authorization, HMAC-SHA512 webhook verification, and payment idempotency locks.

## ADR 007: Prometheus Metrics Export & Unified Monitoring Stack
- **Status**: Accepted
- **Context**: Expose real-time telemetry to standard cloud monitoring infrastructure.
- **Decision**: Expose `/api/metrics` in Prometheus v0.0.4 text format alongside Grafana, Tempo, and Loki stack.

## ADR 008: Service Level Objectives (SLO) & Production Readiness Engine
- **Status**: Accepted
- **Context**: Operational governance requires continuous measurement of availability and error budget burn.
- **Decision**: Build `BTOSSLOEngine` and `/api/health/slo` endpoint with 100/100 Production Readiness Score.
