/**
 * Financial Platform tests — run with:
 *   npx tsx --test src/lib/yip/__tests__/financial-platform.test.ts
 */
import { describe, it, beforeEach, after } from "node:test";
import assert from "node:assert/strict";

import { createYip } from "../bootstrap";
import { CAPABILITIES } from "../registry/capabilities";
import {
  createFinancialPlatform,
  __resetLedgerForTests,
  __resetTransactionsForTests,
  __resetAuditForTests,
} from "../capabilities/financial";
import {
  getFinancialPlatform,
  __resetFinancialPlatformForTests,
} from "@/lib/financial";
import {
  getPinPepperStatus,
  PIN_PEPPER_MIN_LENGTH,
  assertPinPepperProductionReady,
} from "@/lib/pin-pepper";

const envSnapshot = {
  pepper: process.env.YIKE_PIN_PEPPER,
  legacy: process.env.SUPABASE_PIN_PEPPER,
  appEnv: process.env.APP_ENV,
  payments: process.env.ENABLE_PAYMENTS,
  featured: process.env.ENABLE_FEATURED_PAYMENTS,
  wallet: process.env.ENABLE_WALLET,
  settlement: process.env.ENABLE_SETTLEMENT,
};

after(() => {
  restoreEnv("YIKE_PIN_PEPPER", envSnapshot.pepper);
  restoreEnv("SUPABASE_PIN_PEPPER", envSnapshot.legacy);
  restoreEnv("APP_ENV", envSnapshot.appEnv);
  restoreEnv("ENABLE_PAYMENTS", envSnapshot.payments);
  restoreEnv("ENABLE_FEATURED_PAYMENTS", envSnapshot.featured);
  restoreEnv("ENABLE_WALLET", envSnapshot.wallet);
  restoreEnv("ENABLE_SETTLEMENT", envSnapshot.settlement);
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("Phase 0 — YIKE_PIN_PEPPER", () => {
  beforeEach(() => {
    delete process.env.YIKE_PIN_PEPPER;
    delete process.env.SUPABASE_PIN_PEPPER;
    delete process.env.APP_ENV;
  });

  it("reports missing pepper as not ok", () => {
    const status = getPinPepperStatus();
    assert.equal(status.ok, false);
    assert.equal(status.configured, false);
    assert.match(status.message, /missing/i);
  });

  it("rejects short pepper", () => {
    process.env.YIKE_PIN_PEPPER = "too-short";
    const status = getPinPepperStatus();
    assert.equal(status.ok, false);
    assert.equal(status.lengthOk, false);
  });

  it("accepts pepper ≥32 chars", () => {
    process.env.YIKE_PIN_PEPPER = "x".repeat(PIN_PEPPER_MIN_LENGTH);
    const status = getPinPepperStatus();
    assert.equal(status.ok, true);
    assert.equal(status.source, "YIKE_PIN_PEPPER");
  });

  it("assertPinPepperProductionReady is no-op when not production", () => {
    delete process.env.YIKE_PIN_PEPPER;
    delete process.env.APP_ENV;
    // NODE_ENV is typically "test" under the runner — assert must not throw
    assert.doesNotThrow(() => assertPinPepperProductionReady());
  });
});

describe("Financial Platform — single capability, modules", () => {
  beforeEach(() => {
    __resetLedgerForTests();
    __resetTransactionsForTests();
    __resetAuditForTests();
    __resetFinancialPlatformForTests();
    delete process.env.ENABLE_PAYMENTS;
    delete process.env.ENABLE_FEATURED_PAYMENTS;
    delete process.env.ENABLE_WALLET;
    delete process.env.ENABLE_SETTLEMENT;
  });

  it("exposes all domain modules", () => {
    const fp = createFinancialPlatform();
    assert.equal(fp.version, "1.0.0");
    for (const key of [
      "payment",
      "wallet",
      "ledger",
      "transaction",
      "settlement",
      "promotion",
      "subscription",
      "commission",
      "refund",
      "provider",
      "audit",
    ] as const) {
      assert.ok(fp[key], `missing module ${key}`);
    }
  });

  it("ledger is append-only and recordPair creates credit+debit", () => {
    const fp = createFinancialPlatform();
    const { credit, debit } = fp.ledger.recordPair({
      type: "payment",
      accountId: "user:1",
      amount: 5000,
      currency: "NGN",
      reference: "YK_TEST_1",
      correlationId: "corr-1",
      capability: "financial.payment",
      provider: "paystack",
    });
    assert.equal(credit.direction, "credit");
    assert.equal(debit.direction, "debit");
    assert.equal(credit.amount, 5000);
    assert.equal(fp.ledger.listByReference("YK_TEST_1").length, 2);
  });

  it("transaction lifecycle transitions", () => {
    const fp = createFinancialPlatform();
    const tx = fp.transaction.create({
      amount: 1000,
      currency: "NGN",
      reference: "ref-a",
      module: "payment",
    });
    assert.equal(tx.status, "pending");
    const next = fp.transaction.transition(tx.id, "completed");
    assert.equal(next?.status, "completed");
    assert.equal(fp.transaction.getByReference("ref-a")?.status, "completed");
  });

  it("audit records actor and correlation", () => {
    const fp = createFinancialPlatform();
    fp.audit.record({
      actorId: "admin-1",
      capability: "financial.refund",
      provider: "paystack",
      amount: 100,
      currency: "NGN",
      status: "completed",
      reference: "ref-r",
      correlationId: "c-1",
      riskScore: 0,
    });
    const recent = fp.audit.recent(1);
    assert.equal(recent.length, 1);
    assert.equal(recent[0]?.actorId, "admin-1");
  });

  it("health reports disabled payment when flags off", () => {
    const health = createFinancialPlatform().health();
    const payment = health.modules.find((m) => m.id === "payment");
    assert.equal(payment?.enabled, false);
    assert.equal(payment?.status, "disabled");
  });

  it("getFinancialPlatform singleton is stable", () => {
    const a = getFinancialPlatform();
    const b = getFinancialPlatform();
    assert.equal(a, b);
  });

  it("YIP builtins register FINANCIAL_PLATFORM capability", () => {
    const yip = createYip();
    assert.ok(yip.registry.has(CAPABILITIES.FINANCIAL_PLATFORM));
    const instance = yip.registry.get(CAPABILITIES.FINANCIAL_PLATFORM) as {
      version: string;
      payment: unknown;
    };
    assert.equal(instance.version, "1.0.0");
    assert.ok(instance.payment);
  });
});
