/**
 * Yike BTOS — Health & Dependency Monitoring Automated Test Suite (Enterprise Enhancement 2)
 * Tests live health probes for DB, Redis, Storage, Payments, & Messaging.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { DependencyHealthMonitor } from "../observability/dependency-health";

test("Enterprise Health Monitor Full Probe Audit Test", async () => {
  const report = await DependencyHealthMonitor.runFullHealthAudit();
  assert.ok(report.timestamp);
  assert.ok(report.subsystems.database);
  assert.ok(report.subsystems.redis_streams);
  assert.ok(report.subsystems.storage_vault);
  assert.ok(report.subsystems.paystack);
  assert.equal(typeof report.subsystems.database.latencyMs, "number");
});
