/**
 * Yike BTOS — Health & Dependency Monitoring Automated Test Suite (Enterprise Enhancement 2 & 3)
 * Tests live health probes for DB, Redis, Storage, Payments, & Messaging with categories and severity levels.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { DependencyHealthMonitor } from "../observability/dependency-health";

test("Enterprise Health Monitor Categorized Probe Audit Test", async () => {
  const report = await DependencyHealthMonitor.runFullHealthAudit();
  assert.ok(report.timestamp);
  assert.ok(report.categories.critical.database);
  assert.ok(report.categories.critical.redis_streams);
  assert.ok(report.categories.critical.storage_vault);
  assert.ok(report.categories.payments.paystack);
  assert.equal(typeof report.categories.critical.database.latencyMs, "number");
  assert.ok(report.categories.critical.database.severity);
});
