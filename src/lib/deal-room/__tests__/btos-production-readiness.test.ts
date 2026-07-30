/**
 * Yike BTOS Production Readiness Automated Test Suite (Milestone 1 & Milestone 2)
 * Invariant tests for double-entry ledger, durable event streams, & saga rollback.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { LedgerService } from "../settlement/ledger";
import { TransactionSagaManager } from "../workflow/saga";
import { redisStreamAdapter } from "../events/redis-adapter";
import { dealRoomEvents } from "../events";
import { ResultContainer } from "../kernel/result";

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

test("Durable Event Stream Publishing & Replay (Milestone 2)", async () => {
  let receivedCount = 0;
  redisStreamAdapter.subscribeConsumer("inspection_completed", async (rec) => {
    receivedCount += 1;
  });

  const evt = dealRoomEvents.createEvent(
    "ws_stream_101",
    "usr_actor",
    "inspector",
    "inspection_completed",
    "Field Inspection Passed"
  );

  await dealRoomEvents.publish(evt);
  assert.equal(receivedCount, 1);

  // Stream replay test
  const replayed = await redisStreamAdapter.replayStream(undefined, "ws_stream_101");
  assert.equal(replayed.length, 1);
  assert.equal(receivedCount, 2); // Replay dispatched again
});

test("TransactionSagaManager Compensating Rollback on Failure", async () => {
  let step1Compensated = false;
  const saga = new TransactionSagaManager("ws_test");

  saga.addStep({
    name: "Reserve Escrow",
    status: "pending",
    execute: async () => {},
    compensate: async () => {
      step1Compensated = true;
    },
  });

  saga.addStep({
    name: "Failing Execution Step",
    status: "pending",
    execute: async () => {
      throw new Error("Simulated Field Failure");
    },
    compensate: async () => {},
  });

  const success = await saga.execute();
  assert.equal(success, false);
  assert.equal(step1Compensated, true);
});

test("ResultContainer strongly-typed outcomes", () => {
  const okRes = ResultContainer.ok("SuccessValue");
  assert.equal(okRes.isSuccess, true);
  assert.equal(okRes.value, "SuccessValue");

  const failRes = ResultContainer.fail("ErrorOccurred");
  assert.equal(failRes.isSuccess, false);
  assert.equal(failRes.error, "ErrorOccurred");
});
