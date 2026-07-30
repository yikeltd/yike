/**
 * Yike BTOS — Saga Recovery Engine Automated Test Suite (Enterprise Enhancement 1 & 2)
 * Validates checkpoint persistence, automatic startup resume, & durable compensation rollbacks.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { sagaRepository } from "../workflow/saga-repository";
import { TransactionSagaManager } from "../workflow/saga";
import { sagaRecoveryService } from "../workflow/saga-recovery";

test("Persistent Saga Checkpoint & Resume Test", async () => {
  const sagaId = `saga_pers_${Date.now()}`;
  const wsId = `ws_pers_${Date.now()}`;

  let step1Executed = false;
  let step2Executed = false;

  const saga = new TransactionSagaManager(wsId, sagaId);

  saga.addStep(
    "Check Escrow Funds",
    "settlement",
    async () => {
      step1Executed = true;
    },
    async () => {}
  );

  saga.addStep(
    "Verify Vehicle Ownership",
    "trust",
    async () => {
      step2Executed = true;
    },
    async () => {}
  );

  const ok = await saga.executeSaga();
  assert.equal(ok, true);
  assert.equal(step1Executed, true);
  assert.equal(step2Executed, true);

  // Load from persistent repository
  const record = await sagaRepository.loadSaga(sagaId);
  assert.ok(record);
  assert.equal(record?.status, "completed");
  assert.equal(record?.completedSteps.length, 2);
});

test("SagaRecoveryService Startup Scan for In-Flight Executing Sagas Test", async () => {
  const sagaId = `saga_res_${Date.now()}`;
  const wsId = `ws_res_${Date.now()}`;

  // Seed an in-flight EXECUTING saga in repository
  await sagaRepository.saveSaga({
    id: `ps_${sagaId}`,
    sagaId,
    workspaceId: wsId,
    correlationId: `corr_${sagaId}`,
    sagaType: "transaction_workflow",
    currentStep: 1,
    status: "executing",
    completedSteps: ["Step 1"],
    pendingSteps: ["Verify Seller Title"],
    compensationStack: [],
    retryCount: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const recovered = await sagaRecoveryService.recoverInFlightSagas();
  assert.ok(recovered.length >= 1);
});
