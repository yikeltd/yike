import assert from "node:assert/strict";
import test from "node:test";
import {
  isPlaceholderSendchampKey,
  pickSendchampAccessKeyCandidate,
  resolveSendchampAccessKey,
} from "@/lib/notifications/providers/sendchamp-access-key";

const ENV_KEYS = ["SENDCHAMP_API_KEY", "SENDCHAMP_PUBLIC_KEY"] as const;

function saveEnv(): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  return saved;
}

function restoreEnv(saved: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

test("isPlaceholderSendchampKey rejects example placeholders", () => {
  assert.equal(isPlaceholderSendchampKey("your-sendchamp-api-key"), true);
  assert.equal(isPlaceholderSendchampKey("sendchamp_live_real_key_value_here"), false);
});

test("resolveSendchampAccessKey uses longer key when env vars disagree", () => {
  const saved = saveEnv();
  try {
    process.env.SENDCHAMP_API_KEY = "sendchamp_live_truncated";
    process.env.SENDCHAMP_PUBLIC_KEY = "sendchamp_live_full_access_key_value";
    const resolved = resolveSendchampAccessKey();
    assert.equal(resolved?.source, "SENDCHAMP_PUBLIC_KEY");
    assert.equal(resolved?.key, "sendchamp_live_full_access_key_value");
  } finally {
    restoreEnv(saved);
  }
});

test("pickSendchampAccessKeyCandidate labels duplicate keys as SENDCHAMP_PUBLIC_KEY", () => {
  const resolved = pickSendchampAccessKeyCandidate([
    { source: "SENDCHAMP_API_KEY", trimmed: "sendchamp_live_shared_key_value" },
    { source: "SENDCHAMP_PUBLIC_KEY", trimmed: "sendchamp_live_shared_key_value" },
  ]);
  assert.equal(resolved?.source, "SENDCHAMP_PUBLIC_KEY");
});

test("resolveSendchampAccessKey skips placeholder API key and uses public key", () => {
  const saved = saveEnv();
  try {
    process.env.SENDCHAMP_API_KEY = "your-sendchamp-api-key";
    process.env.SENDCHAMP_PUBLIC_KEY = "sendchamp_live_valid_key_value";
    const resolved = resolveSendchampAccessKey();
    assert.equal(resolved?.source, "SENDCHAMP_PUBLIC_KEY");
  } finally {
    restoreEnv(saved);
  }
});
