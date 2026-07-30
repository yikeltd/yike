/**
 * Yike BTOS Production Readiness Automated Test Suite (Milestones 1–4)
 * Invariant tests for double-entry ledger, durable event transport, sagas, & CQRS projections.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { LedgerService } from "../settlement/ledger";
import { TransactionSagaManager } from "../workflow/saga";
import { activeEventTransport } from "../events/transport";
import { dealRoomEvents } from "../events";
import { projectionEngine } from "../projections/projection-engine";
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
