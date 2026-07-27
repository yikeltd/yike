import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  isPaymentsRuntimeEnabled,
  isPaystackConfigured,
} from "@/lib/payments/config";
import {
  isPaymentsEnabled,
  getFinancialFlagSnapshot,
} from "@/lib/yip/capabilities/financial/flags";

describe("payment runtime flags (Phase 2A)", () => {
  const keys = [
    "ENABLE_PAYMENTS",
    "ENABLE_FEATURED_PAYMENTS",
    "PAYSTACK_SECRET_KEY",
  ] as const;
  const prev: Record<string, string | undefined> = {};

  for (const key of keys) prev[key] = process.env[key];

  afterEach(() => {
    for (const key of keys) {
      const value = prev[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("defaults to disabled without env flags", () => {
    delete process.env.ENABLE_PAYMENTS;
    delete process.env.ENABLE_FEATURED_PAYMENTS;
    delete process.env.PAYSTACK_SECRET_KEY;
    assert.equal(isPaymentsEnabled(), false);
    assert.equal(isPaymentsRuntimeEnabled(), false);
    assert.equal(isPaystackConfigured(), false);
  });

  it("requires both flag and secret for runtime", () => {
    process.env.ENABLE_PAYMENTS = "true";
    delete process.env.PAYSTACK_SECRET_KEY;
    assert.equal(isPaymentsEnabled(), true);
    assert.equal(isPaymentsRuntimeEnabled(), false);

    process.env.PAYSTACK_SECRET_KEY = "sk_test_x";
    assert.equal(isPaymentsRuntimeEnabled(), true);
  });

  it("treats ENABLE_FEATURED_PAYMENTS as enabling payments", () => {
    delete process.env.ENABLE_PAYMENTS;
    process.env.ENABLE_FEATURED_PAYMENTS = "true";
    process.env.PAYSTACK_SECRET_KEY = "sk_test_x";
    assert.equal(isPaymentsEnabled(), true);
    assert.equal(isPaymentsRuntimeEnabled(), true);
  });

  it("exposes a financial flag snapshot for diagnostics", () => {
    delete process.env.ENABLE_PAYMENTS;
    delete process.env.ENABLE_FEATURED_PAYMENTS;
    const snap = getFinancialFlagSnapshot();
    assert.equal(typeof snap.payments, "boolean");
    assert.equal(snap.payments, false);
  });
});
