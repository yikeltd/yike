#!/usr/bin/env node
/**
 * Live Sendchamp OTP delivery validation (one billable SMS).
 *
 * Usage:
 *   SENDCHAMP_PUBLIC_KEY=... TEST_PHONE=0803xxxxxxx \
 *     node --env-file=.env.local scripts/validate-sms-otp-delivery.mjs
 *
 * Optional:
 *   CONFIRM_SMS_RECEIVED=true   — mark handset step pass after you receive SMS
 *   SKIP_SEND=true              — dry-run config only
 *   SENDCHAMP_SMS_SENDER=YIKE
 *
 * Does not print API keys. Prints full Sendchamp envelope (no secrets).
 */
import { createHash, randomUUID } from "node:crypto";

const key =
  process.env.SENDCHAMP_PUBLIC_KEY?.trim() ||
  process.env.SENDCHAMP_API_KEY?.trim() ||
  "";
const base = (
  process.env.SENDCHAMP_LIVE_BASE_URL?.trim() ||
  "https://api.sendchamp.com/api/v1"
).replace(/\/$/, "");
const sender = process.env.SENDCHAMP_SMS_SENDER?.trim() || "YIKE";
const rawPhone = process.env.TEST_PHONE?.trim() || "";
const confirmReceived =
  process.env.CONFIRM_SMS_RECEIVED?.trim().toLowerCase() === "true";
const skipSend = process.env.SKIP_SEND?.trim().toLowerCase() === "true";

const results = [];

function check(id, ok, detail) {
  results.push({ id, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}${detail ? ` — ${detail}` : ""}`);
}

function toIntl(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return null;
}

function phoneFp(phone) {
  return createHash("sha256").update(phone).digest("hex").slice(0, 12);
}

async function post(path, body) {
  const started = Date.now();
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, durationMs: Date.now() - started };
}

function pickRef(json) {
  const data = json?.data && typeof json.data === "object" ? json.data : {};
  for (const k of [
    "verification_reference",
    "reference",
    "sms_uid",
    "uid",
    "id",
  ]) {
    const v = data[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

console.log("=== Yike SMS OTP delivery validation ===");
console.log("requestId:", randomUUID());
console.log("base:", base);
console.log("sender:", sender);
console.log("keyPresent:", Boolean(key), "keyLen:", key.length);
console.log("phoneFp:", rawPhone ? phoneFp(toIntl(rawPhone) || rawPhone) : "(none)");

if (!key) {
  check("config_api_key", false, "SENDCHAMP_PUBLIC_KEY / SENDCHAMP_API_KEY missing");
  process.exit(1);
}
check("config_api_key", true, `len=${key.length}`);

if (skipSend) {
  check("skip_send", true, "SKIP_SEND=true — no billable call");
  process.exit(0);
}

const mobile = toIntl(rawPhone);
if (!mobile) {
  check("phone_format", false, "Set TEST_PHONE to a Nigerian number (e.g. 0803…)");
  process.exit(1);
}
check("phone_format", true, `234…${mobile.slice(-4)}`);

const message =
  "Your verification code is: {{code}}. Code is valid for 30 minutes. Never share this code. Welcome to Yike. Happy Listing.";

const body = {
  channel: "sms",
  token_type: "numeric",
  token_length: 6,
  expiration_time: 30,
  customer_mobile_number: mobile,
  customer_email_address: "",
  meta_data: {
    app: "Yike",
    brand: "Yike",
    purpose: "phone_verification_validation",
    description: "Yike OTP delivery validation",
    message,
  },
  in_app_token: false,
  sender,
};

console.log("\n--- POST /verification/create (single call) ---");
const first = await post("/verification/create", body);
console.log("httpStatus:", first.status);
console.log("durationMs:", first.durationMs);
console.log("envelope:", JSON.stringify(first.json, null, 2));

check("http_200", first.status === 200, `got ${first.status}`);

const status = String(first.json?.status ?? "").toLowerCase();
const messageText = String(first.json?.message ?? "").toLowerCase();
check(
  "status_success",
  status === "success",
  `status=${first.json?.status ?? "(missing)"}`
);
check(
  "message_processing",
  messageText.includes("processing") || messageText.includes("success"),
  `message=${first.json?.message ?? "(missing)"}`
);

const reference = pickRef(first.json);
check("has_reference", Boolean(reference), reference || "no reference/id in data");

// Guarantee: do NOT call a second Sendchamp endpoint in this script.
check("single_api_call", true, "script issues exactly one /verification/create");

if (reference) {
  console.log("\nStored reference (app would persist this):", reference);
  check("reference_ready_for_db", true, reference);
} else {
  check("reference_ready_for_db", false, "cannot store missing reference");
}

if (confirmReceived) {
  check("sms_delivered_handset", true, "CONFIRM_SMS_RECEIVED=true");
} else {
  check(
    "sms_delivered_handset",
    false,
    "Set CONFIRM_SMS_RECEIVED=true after the SMS arrives on the device"
  );
}

const apiOk = results
  .filter((r) =>
    [
      "http_200",
      "status_success",
      "has_reference",
      "single_api_call",
    ].includes(r.id)
  )
  .every((r) => r.ok);

console.log("\n=== Summary ===");
console.log(
  JSON.stringify(
    {
      apiPathOk: apiOk,
      handsetConfirmed: confirmReceived,
      commitApproved: apiOk && confirmReceived,
      reference,
    },
    null,
    2
  )
);

if (!apiOk) process.exit(2);
if (!confirmReceived) {
  console.log(
    "\nNEXT: Wait for SMS on the handset, then re-run with CONFIRM_SMS_RECEIVED=true"
  );
  console.log(
    "Then complete verify + resend via the app UI (checklist items 6–8)."
  );
  process.exit(3);
}

process.exit(0);
