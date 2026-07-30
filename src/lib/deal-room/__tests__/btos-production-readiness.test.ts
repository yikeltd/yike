/**
 * Yike BTOS Production Readiness Automated Test Suite (Milestone 1, 2 & 3)
 * Invariant tests for double-entry ledger, durable event transport, & saga orchestrator.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { LedgerService } from "../settlement/ledger";
import { TransactionSagaManager } from "../workflow/saga";
import { activeEventTransport } from "../events/transport";
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

test("EventTransport Abstraction & Durable Stream Replay (Milestone 2 Refinement)", async () => {
  let receivedCount = 0;
  activeEventTransport.subscribe("inspection_completed", async () => {
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
  const replayed = await activeEventTransport.replay(undefined, "ws_stream_101");
  assert.equal(replayed.length, 1);
  assert.equal(receivedCount, 2);
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
    1 // Fail immediately
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
