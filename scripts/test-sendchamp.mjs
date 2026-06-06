#!/usr/bin/env node
/**
 * Smoke-test Sendchamp SMS + WhatsApp wiring (no message sent without --send).
 * Usage:
 *   node --env-file=.env.local scripts/test-sendchamp.mjs
 *   node --env-file=.env.local scripts/test-sendchamp.mjs --send 08012345678
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const phone = process.argv.includes("--send")
  ? process.argv[process.argv.indexOf("--send") + 1]
  : null;

const key =
  process.env.SENDCHAMP_API_KEY?.trim() ||
  process.env.SENDCHAMP_PUBLIC_KEY?.trim() ||
  "";

if (!key) {
  console.error("Missing SENDCHAMP_API_KEY (or SENDCHAMP_PUBLIC_KEY).");
  process.exit(1);
}

const smsSender = process.env.SENDCHAMP_SMS_SENDER?.trim() || "Sendchamp";
const waRaw = process.env.SENDCHAMP_WHATSAPP_SENDER?.trim();
const waSender = (() => {
  const digits = (waRaw || "2348120678278").replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits || "2348120678278";
})();

function toIntl(local) {
  const digits = String(local).replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

async function post(path, body) {
  const res = await fetch(`https://api.sendchamp.com/api/v1${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

console.log("Sendchamp config:");
console.log("  smsSender:", smsSender);
console.log("  whatsappSender:", waSender);
console.log("  keyLength:", key.length);

if (!phone) {
  console.log("\nDry run only. Pass --send 08012345678 to send a test OTP.");
  process.exit(0);
}

const mobile = toIntl(phone);
const code = "123456";

console.log("\nSending WhatsApp verification to", mobile);
const wa = await post("/verification/create", {
  channel: "WHATSAPP",
  sender: waSender,
  token_type: "NUMERIC",
  token_length: 6,
  expiration_time: 10,
  customer_mobile_number: mobile,
  meta_data: { product: "yike", test: true },
  token: code,
});
console.log("WhatsApp:", wa.status, JSON.stringify(wa.json));

console.log("\nSending SMS to", mobile);
const sms = await post("/sms/send", {
  to: [mobile],
  message: `Yike Sendchamp test code ${code}`,
  sender_name: smsSender,
  route: "non_dnd",
});
console.log("SMS:", sms.status, JSON.stringify(sms.json));
