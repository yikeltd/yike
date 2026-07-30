/**
 * Yike BTOS — Concurrency, Race Condition, & Load Test Suite (Milestone 7)
 * Tests simultaneous double-spend prevention & parallel saga execution.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { LedgerService } from "../settlement/ledger";
import { TransactionSagaManager } from "../workflow/saga";
import { IdempotencyGuard } from "../security";

test("Concurrent Double-Spend & Idempotency Lock Test", async () => {
  const idempotencyKey = `idem_concurrent_${Date.now()}`;

  // Simulate 10 parallel webhook requests with same idempotency key
  const requestPromises = Array.from({ length: 10 }).map(async (_, idx) => {
    if (IdempotencyGuard.isDuplicate(idempotencyKey)) {
      return { status: "rejected", requestIndex: idx };
    }
    IdempotencyGuard.recordKey(idempotencyKey);
    return { status: "processed", requestIndex: idx };
  });

  const results = await Promise.all(requestPromises);
  const processed = results.filter((r) => r.status === "processed");
  const rejected = results.filter((r) => r.status === "rejected");

  assert.equal(processed.length, 1);
  assert.equal(rejected.length, 9);
});

test("Parallel Multi-Saga Execution Test", async () => {
  const sagaCount = 5;
  const sagas = Array.from({ length: sagaCount }).map((_, idx) => {
    const manager = new TransactionSagaManager(`ws_parallel_${idx}`);
    manager.addStep(
      `Step A ${idx}`,
      "workflow",
      async () => {},
      async () => {}
    );
    return manager.executeSaga();
  });

  const outcomes = await Promise.all(sagas);
  assert.equal(outcomes.every((res) => res === true), true);
});
