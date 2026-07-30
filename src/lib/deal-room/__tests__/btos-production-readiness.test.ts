/**
 * Yike BTOS Production Readiness Automated Test Suite (Milestones 1–8)
 * Invariant tests for double-entry ledger, durable event transport, sagas, CQRS, observability, security, & circuit breaker.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import crypto from "node:crypto";
import { LedgerService } from "../settlement/ledger";
import { TransactionSagaManager } from "../workflow/saga";
import { activeEventTransport } from "../events/transport";
import { dealRoomEvents } from "../events";
import { projectionEngine } from "../projections/projection-engine";
import { btosTracer, btosMetrics } from "../observability";
import { BTOSSecurityManager, WebhookSecurityManager, IdempotencyGuard } from "../security";
import { CircuitBreaker } from "../kernel/circuit-breaker";
import { ResultContainer } from "../kernel/result";

test("CircuitBreaker Resilience Engine (Milestone 8)", async () => {
  const breaker = new CircuitBreaker(2, 5000); // 2 failures trigger OPEN state

  // 1. First failure
  await assert.rejects(async () => {
    await breaker.execute(async () => {
      throw new Error("API Timeout");
    });
  });

  // 2. Second failure (triggers circuit OPEN)
  await assert.rejects(async () => {
    await breaker.execute(async () => {
      throw new Error("API Timeout");
    });
  });

  assert.equal(breaker.getState(), "open");

  // 3. Fallback execution while OPEN
  const fallbackResult = await breaker.execute(
    async () => "Success",
    () => "FallbackValue"
  );
  assert.equal(fallbackResult, "FallbackValue");
});

test("Double-Entry Ledger Invariant: Sum(Debits) === Sum(Credits)", () => {
  const entries = LedgerService.createBalancedEntries("sett_101", [
    {
      accountId: "acc_escrow",
      entryType: "debit",
      accountType: "escrow_hold",
      amount: 25000000,
      currency: "NGN",
    },
    {
      accountId: "acc_seller",
      entryType: "credit",
      accountType: "seller",
      amount: 25000000,
      currency: "NGN",
    },
  ]);

  assert.equal(entries.length, 2);
  assert.equal(entries[0].amount, entries[1].amount);
  assert.equal(entries[0].entryType, "debit");
  assert.equal(entries[1].entryType, "credit");
});

test("Security Audit: RBAC, HMAC Signatures, & Payment Idempotency (Milestone 6)", () => {
  assert.equal(BTOSSecurityManager.isAuthorized("buyer", "settlement:authorize"), true);
  assert.equal(BTOSSecurityManager.isAuthorized("inspector", "settlement:authorize"), false);

  const secret = "test_secret_key_123";
  const body = JSON.stringify({ event: "charge.success", amount: 25000000 });
  const sig = crypto.createHmac("sha512", secret).update(body).digest("hex");

  assert.equal(WebhookSecurityManager.verifyPaystackSignature(body, sig, secret), true);

  const key = "idem_pay_888999";
  assert.equal(IdempotencyGuard.isDuplicate(key), false);
  IdempotencyGuard.recordKey(key);
  assert.equal(IdempotencyGuard.isDuplicate(key), true);
});

test("Distributed Tracing & Metrics Telemetry (Milestone 5)", async () => {
  const span = btosTracer.startSpan("process_escrow_payout", "ws_obs_777", "usr_actor");
  assert.ok(span.traceId);

  btosMetrics.incrementCounter("escrow_releases", 1);
  btosMetrics.recordLatency("escrow_releases", 120);

  const snapshot = btosMetrics.getSnapshot("escrow_releases");
  assert.equal(snapshot.count, 1);
  assert.equal(snapshot.avgDurationMs, 120);

  btosTracer.endSpan(span.spanId, "ok");
  const history = btosTracer.getTraceHistory("ws_obs_777");
  assert.equal(history.length, 1);
  assert.equal(history[0].status, "ok");
});

test("CQRS Projection Engine Event Projection (Milestone 4)", async () => {
  projectionEngine.initialize();

  const evt = dealRoomEvents.createEvent(
    "ws_cqrs_999",
    "usr_actor",
    "buyer",
    "payment_completed",
    "Escrow Payment Completed"
  );

  await dealRoomEvents.publish(evt);

  const summary = projectionEngine.getWorkspaceSummary("ws_cqrs_999");
  assert.ok(summary);
  assert.equal(summary?.stage, "settled");
  assert.equal(summary?.lastEventTitle, "Escrow Payment Completed");
});

test("TransactionSagaManager Multi-Domain Orchestration & Rollback (Milestone 3)", async () => {
  let settlementRollback = false;
  let executionRollback = false;

  const saga = new TransactionSagaManager("ws_saga_101");

  saga.addStep(
    "Hold Settlement Escrow",
    "settlement",
    async () => {},
    async () => {
      settlementRollback = true;
    }
  );

  saga.addStep(
    "Dispatch Field Inspector",
    "execution",
    async () => {},
    async () => {
      executionRollback = true;
    }
  );

  saga.addStep(
    "Failing Verification Check",
    "trust",
    async () => {
      throw new Error("KYC Verification Failed");
    },
    async () => {},
    5000,
    1
  );

  const success = await saga.executeSaga();
  assert.equal(success, false);
  assert.equal(saga.sagaState, "compensated");
  assert.equal(settlementRollback, true);
  assert.equal(executionRollback, true);
});

test("ResultContainer strongly-typed outcomes", () => {
  const okRes = ResultContainer.ok("SuccessValue");
  assert.equal(okRes.isSuccess, true);
  assert.equal(okRes.value, "SuccessValue");

  const failRes = ResultContainer.fail("ErrorOccurred");
  assert.equal(failRes.isSuccess, false);
  assert.equal(failRes.error, "ErrorOccurred");
});
