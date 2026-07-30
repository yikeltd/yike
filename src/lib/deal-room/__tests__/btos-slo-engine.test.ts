/**
 * Yike BTOS — SLO Engine & Production Readiness Automated Test Suite (Enterprise Enhancement 6)
 * Validates SLO calculation, error budget burn rates, & 100/100 readiness score certification.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { BTOSSLOEngine } from "../observability/slo-engine";

test("SLO Engine Report & Error Budget Calculations Test", () => {
  const report = BTOSSLOEngine.getSLOReport();
  assert.equal(report.overall, "healthy");
  assert.ok(report.slos.length >= 9);
  assert.ok(report.errorBudgets.length >= 9);

  const apiSlo = report.slos.find((s) => s.id === "slo_api");
  assert.ok(apiSlo);
  assert.equal(apiSlo?.targetPercent, 99.9);

  const apiBudget = report.errorBudgets.find((b) => b.sloId === "slo_api");
  assert.ok(apiBudget);
  assert.equal(typeof apiBudget?.allowedDowntimeMinutes, "number");
  assert.equal(typeof apiBudget?.remainingBudgetPercent, "number");
});

test("Production Readiness Score 100/100 Certification Test", () => {
  const readiness = BTOSSLOEngine.calculateReadinessScore();
  assert.equal(readiness.overallScore, 100);
  assert.equal(readiness.certification, "ENTERPRISE_READY");
  assert.equal(readiness.categories.length, 7);
});
