import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  clearPinPreflightCache,
  readCachedPinPreflight,
  requestPinPreflight,
} from "@/lib/auth/pin-login-client";

const PREFLIGHT_ROUTE = path.resolve(
  process.cwd(),
  "src/app/api/auth/pin/preflight/route.ts"
);

test("pin preflight route does not dispatch OTP or SMS", () => {
  const src = fs.readFileSync(PREFLIGHT_ROUTE, "utf8");
  assert.doesNotMatch(src, /sendOtp|send-code|createSendchamp|verification\/create/i);
  assert.match(src, /evaluatePinLoginGate|pinLoginGateToJson/);
});

test("preflight client cache avoids duplicate network for same identifier", async () => {
  const identifier = "cache-test@yike.ng";
  clearPinPreflightCache(identifier);

  let calls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(
      JSON.stringify({ canUsePin: true, step: "pin" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const first = await requestPinPreflight({ identifier });
    const second = await requestPinPreflight({ identifier });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.equal(calls, 1);
    assert.equal(readCachedPinPreflight(identifier)?.canUsePin, true);
  } finally {
    globalThis.fetch = originalFetch;
    clearPinPreflightCache(identifier);
  }
});

test("aborted inflight preflight does not block a fresh request", async () => {
  const identifier = "abort-retry@yike.ng";
  clearPinPreflightCache(identifier);

  let calls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    calls += 1;
    await new Promise<void>((resolve, reject) => {
      const signal = init?.signal;
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {
        once: true,
      });
      setTimeout(resolve, 50);
    });
    return new Response(JSON.stringify({ canUsePin: true, step: "pin" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const controller = new AbortController();
    const pending = requestPinPreflight({ identifier, bypassCache: true, signal: controller.signal });
    controller.abort();
    const aborted = await pending;
    assert.equal(aborted.ok, false);
    if (!aborted.ok) assert.equal(aborted.kind, "aborted");

    const retry = await requestPinPreflight({ identifier, bypassCache: true });
    assert.equal(retry.ok, true);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    clearPinPreflightCache(identifier);
  }
});
