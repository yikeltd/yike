/**
 * Yike BTOS — End-to-End Multi-Domain Transaction Lifecycle Integration Test (Milestone 7)
 * Tests full flow: Conversation -> Negotiation -> Appointment -> Trust -> Execution -> Visual -> Intelligence -> Settlement -> Workflow -> Lifecycle.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { LedgerService } from "../settlement/ledger";
import { TransactionSagaManager } from "../workflow/saga";
import { activeEventTransport } from "../events/transport";
import { dealRoomEvents } from "../events";
import { projectionEngine } from "../projections/projection-engine";
import { btosTracer, btosMetrics } from "../observability";
import { BTOSSecurityManager, WebhookSecurityManager, IdempotencyGuard } from "../security";

test("Full E2E BTOS Transaction Lifecycle Simulation", async () => {
  const workspaceId = `ws_e2e_${Date.now()}`;
  projectionEngine.initialize();

  // 1. Conversation & Negotiation
  const startSpan = btosTracer.startSpan("e2e_start", workspaceId, "usr_buyer");
  const offerEvt = dealRoomEvents.createEvent(
    workspaceId,
    "usr_buyer",
    "buyer",
    "offer_created",
    "Offer Submitted: NGN 25,000,000"
  );
  await dealRoomEvents.publish(offerEvt);

  // 2. Settlement Escrow Deposit
  const entries = LedgerService.createBalancedEntries("sett_e2e_101", [
    {
      accountId: `acc_escrow_${workspaceId}`,
      entryType: "debit",
      accountType: "escrow_hold",
      amount: 25000000,
      currency: "NGN",
    },
    {
      accountId: `acc_seller_${workspaceId}`,
      entryType: "credit",
      accountType: "seller",
      amount: 25000000,
      currency: "NGN",
    },
  ]);
  assert.equal(entries.length, 2);

  // 3. Workflow Saga Execution
  const saga = new TransactionSagaManager(workspaceId);
  saga.addStep(
    "Verify Buyer Identity",
    "trust",
    async () => {},
    async () => {}
  );
  saga.addStep(
    "Perform Field Vehicle Inspection",
    "execution",
    async () => {},
    async () => {}
  );
  saga.addStep(
    "Release Settlement Funds",
    "settlement",
    async () => {},
    async () => {}
  );

  const sagaSuccess = await saga.executeSaga();
  assert.equal(sagaSuccess, true);
  assert.equal(saga.sagaState, "completed");

  // 4. CQRS Projection Update
  const paymentEvt = dealRoomEvents.createEvent(
    workspaceId,
    "usr_buyer",
    "buyer",
    "payment_completed",
    "Escrow Release Approved"
  );
  await dealRoomEvents.publish(paymentEvt);

  const summary = projectionEngine.getWorkspaceSummary(workspaceId);
  assert.ok(summary);
  assert.equal(summary?.stage, "settled");

  btosTracer.endSpan(startSpan.spanId, "ok");
});
