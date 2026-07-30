/**
 * Yike BTOS — Failure Injection & Stream Replay Test Suite (Milestone 7)
 * Tests provider timeouts, dead-letter queue escalation, & historical stream replay.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { activeEventTransport } from "../events/transport";
import { dealRoomEvents } from "../events";
import { TransactionSagaManager } from "../workflow/saga";

test("Provider Timeout & Failure Injection Recovery", async () => {
  let rollbackTriggered = false;
  const saga = new TransactionSagaManager("ws_fail_inject");

  saga.addStep(
    "Hold Funds",
    "settlement",
    async () => {},
    async () => {
      rollbackTriggered = true;
    }
  );

  saga.addStep(
    "Slow External Provider",
    "execution",
    async () => {
      // Simulate hung provider
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    async () => {},
    50, // Timeout after 50ms
    1
  );

  const success = await saga.executeSaga();
  assert.equal(success, false);
  assert.equal(rollbackTriggered, true);
  assert.equal(saga.sagaState, "compensated");
});

test("Durable Event Stream Replay Integrity Test", async () => {
  const wsId = `ws_replay_${Date.now()}`;
  const evt = dealRoomEvents.createEvent(
    wsId,
    "usr_actor",
    "buyer",
    "document_verified",
    "Title Document Verified"
  );

  await dealRoomEvents.publish(evt);

  const replayed = await activeEventTransport.replay(undefined, wsId);
  assert.ok(replayed.length >= 1);
  assert.equal(replayed[0].payload.title, "Title Document Verified");
});
