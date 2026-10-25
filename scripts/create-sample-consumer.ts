/**
 * Create one ordinary consumer account (not staff) on the linked Yike Supabase project.
 *
 * Requires:
 *   YIKE_SAMPLE_CONSUMER_EMAIL — inbox you control
 *   YIKE_SAMPLE_CONSUMER_PHONE — unique 11-digit Nigerian local (080…)
 *   YIKE_OTP_SERVER_TOKEN, SUPABASE_SERVICE_ROLE_KEY, linked Supabase URL
 *
 *   YIKE_CREDENTIALS_FILE — append TEMPORARY PIN (mode 600)
 */
import { createClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";
import { appendFileSync, chmodSync } from "node:fs";
import { hashPin } from "../src/lib/pin";
import { pinPolicyError } from "../src/lib/pin-policy";

const CANONICAL_REF = "hlpojfurfldvcxfxhveg";
const STAFF_ROLES = new Set([
  "super_admin",
  "admin",
  "support",
  "tech",
  "content",
  "careers",
  "moderator",
]);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const otpToken = process.env.YIKE_OTP_SERVER_TOKEN?.trim();
const email = process.env.YIKE_SAMPLE_CONSUMER_EMAIL?.trim().toLowerCase();
const phoneRaw = process.env.YIKE_SAMPLE_CONSUMER_PHONE?.trim();
const credentialsFile = process.env.YIKE_CREDENTIALS_FILE?.trim();
const pinEnv = process.env.CONSUMER_PIN?.trim();

function refFromUrl(s: string): string | null {
  const m = String(s).match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1]?.toLowerCase() ?? null;
}

function generatePin(): string {
  for (let i = 0; i < 30; i++) {
    const digits = Array.from({ length: 6 }, () => randomInt(0, 10)).join("");
    if (!pinPolicyError(digits)) return digits;
  }
  throw new Error("Could not generate PIN");
}

function writeBlock(lines: string[]) {
  if (!credentialsFile) return;
  const block = [
    `# Sample consumer — TEMPORARY — delete after saving elsewhere`,
    `# Generated: ${new Date().toISOString()}`,
    ...lines,
    "",
  ].join("\n");
  appendFileSync(credentialsFile, block);
  chmodSync(credentialsFile, 0o600);
}

if (!url || !serviceKey || !otpToken) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, YIKE_OTP_SERVER_TOKEN");
  process.exit(1);
}
if (!email) {
  console.error("Missing YIKE_SAMPLE_CONSUMER_EMAIL — set an inbox you control.");
  process.exit(1);
}
if (!phoneRaw || !/^0[789]\d{9}$/.test(phoneRaw)) {
  console.error("Missing or invalid YIKE_SAMPLE_CONSUMER_PHONE (11-digit Nigerian local 080…).");
  process.exit(1);
}
if (refFromUrl(url) !== CANONICAL_REF) {
  console.error(`Refusing: Supabase ref must be ${CANONICAL_REF}`);
  process.exit(1);
}
if (!credentialsFile) {
  console.error("Set YIKE_CREDENTIALS_FILE for local TEMPORARY credential output.");
  process.exit(1);
}

const pin = pinEnv && /^\d{6}$/.test(pinEnv) && !pinPolicyError(pinEnv) ? pinEnv : generatePin();
const pinHash = hashPin(pin);

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);
  if (existing) {
    console.error("Refusing: user already exists for", email);
    process.exit(1);
  }

  const { data: phoneDup } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", phoneRaw)
    .maybeSingle();
  if (phoneDup) {
    console.error("Refusing: phone already registered.");
    process.exit(1);
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: email!,
    password: pin,
    email_confirm: false,
    user_metadata: { full_name: "Yike Sample User" },
  });
  if (createErr) throw createErr;
  const userId = created.user!.id;

  const usernameBase = email!.split("@")[0].replace(/[^a-z0-9_]/gi, "_").slice(0, 20);
  const username = `${usernameBase}_${randomInt(100, 999)}`;

  const { error: rpcErr } = await admin.rpc("yike_complete_signup", {
    p_token: otpToken,
    p_user_id: userId,
    p_username: username,
    p_pin_hash: pinHash,
    p_phone: phoneRaw,
    p_full_name: "Yike Sample User",
    p_phone_verified: false,
  });

  if (rpcErr) {
    console.error("yike_complete_signup failed:", rpcErr.message);
    await admin.auth.admin.deleteUser(userId);
    process.exit(1);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role, email_verified, phone_verified")
    .eq("id", userId)
    .single();

  if (profile && STAFF_ROLES.has(profile.role as string)) {
    console.error("Refusing: profile has staff role after signup");
    process.exit(1);
  }

  writeBlock([
    "login_url=http://127.0.0.1:3000/auth/login",
    `email=${email}`,
    `six_digit_pin=${pin}`,
    `username=${username}`,
    `phone=${phoneRaw}`,
    "email_verification=required (email_confirm false)",
    "sms_phone_verification=pending (phone_verified false)",
  ]);

  console.log("Sample consumer created:", userId);
  console.log("  Login: http://127.0.0.1:3000/auth/login");
  console.log("  Email:", email);
  console.log("  TEMPORARY PIN written to:", credentialsFile);
  console.log("  Email verification: required");
  console.log("  SMS phone verify: pending");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
