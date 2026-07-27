import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { paystackProvider } from "@/lib/payments/providers/paystack";

const SECRET = "sk_test_yike_phase2a_signature";

describe("paystackProvider.verifyWebhookSignature", () => {
  const prev = process.env.PAYSTACK_SECRET_KEY;

  afterEach(() => {
    if (prev === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = prev;
  });

  it("accepts a valid HMAC-SHA512 signature", () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    const rawBody = JSON.stringify({
      event: "charge.success",
      data: { reference: "yk_test_ref", id: 42 },
    });
    const signature = createHmac("sha512", SECRET).update(rawBody).digest("hex");
    const headers = new Headers({ "x-paystack-signature": signature });
    assert.equal(paystackProvider.verifyWebhookSignature?.(rawBody, headers), true);
  });

  it("rejects missing signature", () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    const rawBody = '{"event":"charge.success"}';
    assert.equal(
      paystackProvider.verifyWebhookSignature?.(rawBody, new Headers()),
      false,
    );
  });

  it("rejects tampered body", () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    const rawBody = '{"event":"charge.success","data":{"reference":"a"}}';
    const signature = createHmac("sha512", SECRET).update(rawBody).digest("hex");
    const tampered = '{"event":"charge.success","data":{"reference":"b"}}';
    const headers = new Headers({ "x-paystack-signature": signature });
    assert.equal(paystackProvider.verifyWebhookSignature?.(tampered, headers), false);
  });

  it("rejects when secret is unset", () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const rawBody = "{}";
    const headers = new Headers({ "x-paystack-signature": "abc" });
    assert.equal(paystackProvider.verifyWebhookSignature?.(rawBody, headers), false);
  });
});
