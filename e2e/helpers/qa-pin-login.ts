/**
 * Local QA auth helpers for Playwright — never logs secrets.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomInt } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { APIRequestContext } from "@playwright/test";

export const QA_SIGNUP_EMAIL = "qa.signup@yike.ng";
const PRODUCTION_REF = "hlpojfurfldvcxfxhveg";
const QUICK_USER_KEY = "yike_quick_user";

const repoRoot = process.cwd();

function loadEnvFile(relativePath: string, onlyMissing: boolean) {
  const path = join(repoRoot, relativePath);
  if (!existsSync(path)) return false;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (onlyMissing && process.env[key]) continue;
    process.env[key] = val;
  }
  return true;
}

function loadEnvLocalIfNeeded() {
  if (process.env.E2E_ISOLATED_SUPABASE === "1") {
    loadEnvFile(".env.e2e.local", false);
    return;
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  loadEnvFile(".env.local", true);
}

loadEnvLocalIfNeeded();

function projectRefFromUrl(url: string | undefined) {
  const m = String(url ?? "").match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1]?.toLowerCase() ?? null;
}

export function qaBrowserVerificationAvailable(): boolean {
  return Boolean(readQaPinFromLocalFile());
}

export function qaAdminOtpSeedAllowed(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return false;
  const ref = projectRefFromUrl(url);
  if (!ref || ref === PRODUCTION_REF) return false;
  return true;
}

/** @deprecated use qaBrowserVerificationAvailable */
export function qaLocalAuthAvailable(): boolean {
  return qaBrowserVerificationAvailable() && qaAdminOtpSeedAllowed();
}

export function readQaPinFromLocalFile(): string | null {
  const path = join(repoRoot, ".local-test-credentials.txt");
  if (!existsSync(path)) return null;
  const m = readFileSync(path, "utf8").match(/^six_digit_pin=(\d{6})/m);
  return m?.[1] ?? null;
}

/** Optional: last login OTP from email (avoids another send when rate-limited). Never commit. */
export function readQaLoginOtpFromLocalFile(): string | null {
  const fromEnv = process.env.E2E_QA_LOGIN_OTP?.trim();
  if (fromEnv && /^\d{6}$/.test(fromEnv)) return fromEnv;
  const path = join(repoRoot, ".local-test-credentials.txt");
  if (!existsSync(path)) return null;
  const m = readFileSync(path, "utf8").match(/^login_otp=(\d{6})/m);
  return m?.[1] ?? null;
}

async function verifyLoginOtp(
  request: APIRequestContext,
  email: string,
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const verifyRes = await request.post("/api/auth/verify-email-otp", {
    data: { email, otp: code, code, purpose: "login" },
  });
  if (verifyRes.ok()) return { ok: true };
  const body = (await verifyRes.json().catch(() => ({}))) as { error?: string };
  return {
    ok: false,
    error: body.error?.trim() || `HTTP ${verifyRes.status()}`,
  };
}

/** True when test 2 can establish trust without hitting production OTP send rate limits. */
export function qaTrustedDeviceSetupMode(): "seed" | "cached_otp" | "opt_in_send" | "needs_setup" {
  if (qaAdminOtpSeedAllowed()) return "seed";
  if (readQaLoginOtpFromLocalFile()) return "cached_otp";
  if (process.env.E2E_ALLOW_LOGIN_OTP_SEND === "1") return "opt_in_send";
  return "needs_setup";
}

function hashOtp(otp: string) {
  return createHash("sha256").update(String(otp)).digest("hex");
}

async function seedLoginOtp(email: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase admin env for OTP seed");
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await admin.from("auth_email_otps").delete().eq("email", email).eq("purpose", "login");
  const { error } = await admin.from("auth_email_otps").insert({
    email,
    purpose: "login",
    otp_hash: hashOtp(code),
    expires_at: expiresAt,
  });
  if (error) throw new Error(`OTP seed failed: ${error.message}`);
  return code;
}

type LoginBody = {
  needsLoginOtp?: boolean;
  needsEmailVerify?: boolean;
  profile?: { id?: string; email?: string; full_name?: string | null; username?: string | null; avatar_url?: string | null };
};

/** Password + optional login OTP via API (establishes session + device cookie). */
export async function apiPasswordLogin(
  request: APIRequestContext,
  identifier: string,
  password: string
): Promise<LoginBody> {
  const loginRes = await request.post("/api/auth/login", {
    data: { identifier, password },
  });
  const loginBody = (await loginRes.json()) as LoginBody & { error?: string };
  if (!loginRes.ok()) {
    throw new Error(`Login failed (${loginRes.status()}): ${loginBody.error ?? "unknown"}`);
  }

  if (loginBody.needsLoginOtp) {
    const cachedOtp = readQaLoginOtpFromLocalFile();
    if (cachedOtp) {
      const verified = await verifyLoginOtp(request, identifier, cachedOtp);
      if (verified.ok) return loginBody;
      throw new Error(
        `Stored login_otp rejected (${verified.error}). Update login_otp= in .local-test-credentials.txt or E2E_QA_LOGIN_OTP — no OTP send attempted.`
      );
    }

    if (qaAdminOtpSeedAllowed()) {
      const code = await seedLoginOtp(identifier);
      const seeded = await verifyLoginOtp(request, identifier, code);
      if (!seeded.ok) {
        throw new Error(`OTP verify failed after dev seed: ${seeded.error}`);
      }
      return loginBody;
    }

    if (process.env.E2E_ALLOW_LOGIN_OTP_SEND !== "1") {
      throw new Error(
        "Login OTP required on production-linked env: set login_otp=###### (from email, valid ~30m), use non-production Supabase + service role for seed, or run once with E2E_ALLOW_LOGIN_OTP_SEND=1."
      );
    }

    const sendRes = await request.post("/api/auth/send-email-otp", {
      data: { email: identifier, purpose: "login" },
    });
    const sendBody = (await sendRes.json()) as { devOtp?: string; error?: string };
    let code = sendBody.devOtp ? String(sendBody.devOtp) : undefined;
    if (!sendRes.ok() || !code) {
      const lastSendError = sendBody.error ?? `HTTP ${sendRes.status()}`;
      if (sendRes.status() === 429) {
        throw new Error(
          `OTP send rate limited: ${lastSendError} (60s resend cooldown or 5 sends/hour per email).`
        );
      }
      throw new Error(`Login OTP send failed: ${lastSendError}`);
    }
    const sent = await verifyLoginOtp(request, identifier, String(code));
    if (!sent.ok) {
      throw new Error(`OTP verify failed: ${sent.error}`);
    }
  }

  return loginBody;
}

/** Ensure device trust via login OTP when password session exists but device is new. */
export async function ensureDeviceTrustViaLoginOtp(
  request: APIRequestContext,
  email: string
): Promise<void> {
  const sendRes = await request.post("/api/auth/send-email-otp", {
    data: { email, purpose: "login" },
  });
  const sendBody = (await sendRes.json()) as { devOtp?: string; error?: string };
  let code = sendBody.devOtp;
  if (!sendRes.ok() || !code) {
    if (!qaAdminOtpSeedAllowed()) {
      throw new Error("Device trust OTP unavailable without devOtp or dev sandbox seed");
    }
    code = await seedLoginOtp(email);
  }
  const verifyRes = await request.post("/api/auth/verify-email-otp", {
    data: { email, code: String(code), purpose: "login" },
  });
  if (!verifyRes.ok()) {
    const body = (await verifyRes.json()) as { error?: string };
    throw new Error(`Device trust OTP verify failed: ${body.error ?? verifyRes.status()}`);
  }
}

export function quickUserInitScript(email: string, profile: LoginBody["profile"]) {
  return `
    localStorage.setItem(${JSON.stringify(QUICK_USER_KEY)}, JSON.stringify({
      userId: ${JSON.stringify(profile?.id ?? "")},
      email: ${JSON.stringify(email)},
      fullName: ${JSON.stringify(profile?.full_name ?? null)},
      username: ${JSON.stringify(profile?.username ?? null)},
      avatarUrl: ${JSON.stringify(profile?.avatar_url ?? null)},
    }));
  `;
}

export type PreflightMetrics = {
  count: number;
  durationsMs: number[];
};

export function attachPreflightMetrics(page: import("@playwright/test").Page): PreflightMetrics {
  const metrics: PreflightMetrics = { count: 0, durationsMs: [] };
  const starts = new Map<string, number>();

  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/api/auth/pin/preflight")) {
      const id = `${Date.now()}-${Math.random()}`;
      starts.set(id, Date.now());
      (req as unknown as { __preflightId?: string }).__preflightId = id;
      metrics.count += 1;
    }
  });

  page.on("response", (res) => {
    if (res.request().method() === "POST" && res.url().includes("/api/auth/pin/preflight")) {
      const started = [...starts.values()].pop();
      if (started != null) {
        metrics.durationsMs.push(Date.now() - started);
      }
      if (starts.size) {
        const firstKey = starts.keys().next().value;
        if (firstKey) starts.delete(firstKey);
      }
    }
  });

  return metrics;
}
