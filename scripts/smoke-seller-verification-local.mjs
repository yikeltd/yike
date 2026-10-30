#!/usr/bin/env node
/**
 * Local authenticated smoke — seller profile review (qa.signup + disposable queue case).
 * Does not print PINs, OTPs, or API keys.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomInt } from "crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SMOKE_BASE_URL?.trim() || "http://127.0.0.1:3000";
const QA_EMAIL = "qa.signup@yike.ng";

function loadEnvFile(name) {
  try {
    const text = readFileSync(join(__dirname, "..", name), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq);
      let val = trimmed.slice(eq + 1);
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(".env.local");

function readQaPin() {
  try {
    const cred = readFileSync(join(__dirname, "..", ".local-test-credentials.txt"), "utf8");
    const m = cred.match(/^six_digit_pin=(\d{6})/m);
    if (m) return m[1];
  } catch {
    /* fall through */
  }
  throw new Error("Missing qa PIN in .local-test-credentials.txt");
}

function parseSetCookie(headers) {
  const raw = headers.getSetCookie?.() ?? [];
  const jar = new Map();
  for (const line of raw.length ? raw : [headers.get("set-cookie")].filter(Boolean)) {
    const part = String(line).split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) jar.set(part.slice(0, eq), part.slice(eq + 1));
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function fetchJson(path, jar, init = {}) {
  const headers = new Headers(init.headers || {});
  const ch = cookieHeader(jar);
  if (ch) headers.set("Cookie", ch);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  for (const [k, v] of parseSetCookie(res.headers)) jar.set(k, v);
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

function redactBody(body) {
  const copy = { ...body };
  delete copy.devOtp;
  delete copy.otp;
  return copy;
}

function hashOtp(otp) {
  return createHash("sha256").update(String(otp)).digest("hex");
}

async function seedLoginOtp(admin, email) {
  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await admin.from("auth_email_otps").delete().eq("email", email).eq("purpose", "login");
  const { error } = await admin.from("auth_email_otps").insert({
    email,
    purpose: "login",
    otp_hash: hashOtp(code),
    expires_at: expiresAt,
  });
  if (error) throw new Error(`seed login otp failed: ${error.message}`);
  return code;
}

async function loginWithDeviceTrust(email, password, jar, admin) {
  const login = await fetchJson("/api/auth/login", jar, {
    method: "POST",
    body: JSON.stringify({ identifier: email, password }),
  });
  if (!login.res.ok) {
    throw new Error(`login failed ${login.res.status} ${login.body.error || ""}`);
  }
  if (login.body.needsLoginOtp) {
    const send = await fetchJson("/api/auth/send-email-otp", jar, {
      method: "POST",
      body: JSON.stringify({ email, purpose: "login" }),
    });
    let code = send.body.devOtp;
    if (!send.res.ok || !code) {
      code = await seedLoginOtp(admin, email);
    }
    if (!code) {
      throw new Error("login OTP required but could not obtain code");
    }
    const verify = await fetchJson("/api/auth/verify-email-otp", jar, {
      method: "POST",
      body: JSON.stringify({ email, code: String(code), purpose: "login" }),
    });
    if (!verify.res.ok) {
      throw new Error(`verify login otp failed ${verify.res.status}`);
    }
  }
  return login.body;
}

async function markPhoneVerifiedOperator(admin, userId, phoneLocal) {
  const now = new Date().toISOString();
  const { error } = await admin
    .from("profiles")
    .update({
      phone_verified: true,
      phone_verified_at: now,
      phone: phoneLocal,
      whatsapp: phoneLocal,
      whatsapp_verified_at: now,
      whatsapp_verification_status: "verified",
    })
    .eq("id", userId);
  if (error) throw new Error(`phone mark failed: ${error.message}`);
}

async function snapshotProfile(admin, userId) {
  const { data } = await admin
    .from("profiles")
    .select(
      "role, verification_status, verified_badge, phone_verified, phone, seller_profile_completed_at, verification_submitted_at, residential_address, residential_state, date_of_birth, full_name"
    )
    .eq("id", userId)
    .single();
  return data;
}

async function latestVerification(admin, userId) {
  const { data } = await admin
    .from("agent_verifications")
    .select("id, status, verification_notes, nin_provider, reviewed_at")
    .eq("agent_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

function parseReviewNotes(raw) {
  if (!raw?.trim()?.startsWith("{")) return null;
  try {
    const j = JSON.parse(raw);
    return j?.aiReview ?? null;
  } catch {
    return null;
  }
}

async function submitSellerProfile(jar, payload) {
  return fetchJson("/api/agent/seller-verification", jar, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function resetQaSellerState(admin, userId) {
  await admin.from("agent_verifications").delete().eq("agent_id", userId);
  await admin.from("auth_email_otps").delete().eq("email", QA_EMAIL);
  await admin
    .from("profiles")
    .update({
      role: "user",
      verification_status: "not_started",
      verified_badge: false,
      seller_profile_completed_at: null,
      verification_submitted_at: null,
      residential_address: null,
      residential_state: null,
      date_of_birth: null,
      verification_notes: null,
      verified_at: null,
      listing_limit: null,
    })
    .eq("id", userId);
}

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${detail ? `: ${detail}` : ""}`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    console.error("Missing Supabase env in .env.local");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const qaPin = readQaPin();
  const { data: qaUser } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const qa = qaUser?.users?.find((u) => u.email?.toLowerCase() === QA_EMAIL);
  if (!qa?.id) {
    console.error("qa.signup user not found");
    process.exit(1);
  }
  const qaId = qa.id;
  const qaPhone = "08031999001";

  const qaBefore = await snapshotProfile(admin, qaId);

  // --- Case A: clean auto-approve (rules-only; AI unset on server) ---
  await resetQaSellerState(admin, qaId);
  await markPhoneVerifiedOperator(admin, qaId, qaPhone);

  const jarA = new Map();
  await loginWithDeviceTrust(QA_EMAIL, qaPin, jarA, admin);
  record("qa.signup login + device trust", true, "session established");

  const submitA = await submitSellerProfile(jarA, {
    residentialState: "Lagos",
    residentialAddress: "QA Smoke Test Address 12, Lekki",
    dateOfBirth: "1992-03-15",
    occupation: "QA Tester",
    consentAccepted: true,
    accountType: "individual",
    returnPath: "/agent/listings/choose",
  });

  const pubA = redactBody(submitA.body);
  if (!submitA.res.ok) {
    record("clean profile POST", false, `${submitA.res.status} ${pubA.error || ""}`);
  } else {
    record(
      "clean profile POST",
      true,
      `customerStatus=${pubA.customerStatus} autoApproved=${pubA.autoApproved}`
    );
    const leaks =
      "confidence" in pubA ||
      "reasonCodes" in pubA ||
      "recommendation" in pubA;
    record("customer API privacy (clean)", !leaks, leaks ? "internal fields leaked" : "ok");
  }

  const profAfterA = await snapshotProfile(admin, qaId);
  const verA = await latestVerification(admin, qaId);
  const aiA = parseReviewNotes(verA?.verification_notes);

  record(
    "DB auto-approve (clean)",
    profAfterA?.verification_status === "approved" &&
      profAfterA?.verified_badge === true &&
      profAfterA?.role === "agent_verified" &&
      verA?.status === "approved",
    `profile=${profAfterA?.verification_status} role=${profAfterA?.role} verRow=${verA?.status} provider=${verA?.nin_provider}`
  );

  if (aiA) {
    record(
      "DB review metadata (staff)",
      aiA.recommendation === "approve" && aiA.confidence >= 0.85,
      `recommendation=${aiA.recommendation} confidence=${aiA.confidence}`
    );
  }

  // --- Case B: queue (duplicate phone with qa) ---
  const disposableEmail = `qa.smoke.queue.${Date.now()}@yike.ng`;
  const disposablePin = String(randomInt(100000, 999999));
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: disposableEmail,
    password: disposablePin,
    email_confirm: true,
    user_metadata: { full_name: "Smoke" },
  });
  if (createErr || !created.user?.id) {
    record("disposable user create", false, createErr?.message || "no user");
  } else {
    const dId = created.user.id;
    await admin
      .from("profiles")
      .update({
        email_verified: true,
        full_name: "Smoke",
        phone: qaPhone,
        whatsapp: qaPhone,
      })
      .eq("id", dId);
    await markPhoneVerifiedOperator(admin, dId, qaPhone);

    const jarB = new Map();
    await loginWithDeviceTrust(disposableEmail, disposablePin, jarB, admin);

    const submitB = await submitSellerProfile(jarB, {
      residentialState: "Lagos",
      residentialAddress: "QA Smoke Test Address 12, Lekki",
      dateOfBirth: "1992-03-15",
      consentAccepted: true,
      accountType: "individual",
    });
    const pubB = redactBody(submitB.body);
    record(
      "duplicate-phone POST",
      submitB.res.ok && pubB.customerStatus === "checking" && pubB.autoApproved === false,
      `status=${submitB.res.status} customerStatus=${pubB.customerStatus} autoApproved=${pubB.autoApproved}`
    );

    const profB = await snapshotProfile(admin, dId);
    const verB = await latestVerification(admin, dId);
    const aiB = parseReviewNotes(verB?.verification_notes);
    record(
      "DB queued (duplicate phone)",
      profB?.verification_status === "pending" &&
        profB?.verified_badge === false &&
        verB?.status === "pending",
      `profile=${profB?.verification_status} verRow=${verB?.status}`
    );
    record(
      "staff queue reason codes",
      Boolean(aiB?.reasonCodes?.includes("duplicate_phone")),
      aiB?.reasonCodes?.join(",") || "none"
    );

    const statusLeak = await fetchJson("/api/agent/seller-verification/status", jarB);
    const statusBody = JSON.stringify(statusLeak.body);
    record(
      "customer status route privacy",
      !statusBody.includes("confidence") &&
        !statusBody.includes("reasonCodes") &&
        !statusBody.includes("aiReview"),
      statusLeak.res.status === 200 ? "no internal AI fields" : `http ${statusLeak.res.status}`
    );

    const adminLeak = await fetch(`${BASE}/api/admin/agents/verification`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verification_id: verB?.id, agent_id: dId, action: "approve" }),
    });
    record("admin approve blocked unauthenticated", adminLeak.status === 401 || adminLeak.status === 403, `http ${adminLeak.status}`);

    const { count: pendingQueueCount } = await admin
      .from("agent_verifications")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", dId)
      .eq("status", "pending");
    record(
      "staff queue row exists (DB)",
      (pendingQueueCount ?? 0) >= 1,
      `pendingRows=${pendingQueueCount ?? 0}`
    );

    const staffPageAnon = await fetch(`${BASE}/lex/auth/agents`, { redirect: "manual" });
    record(
      "staff agents page blocked (no session)",
      staffPageAnon.status === 307 || staffPageAnon.status === 302 || staffPageAnon.status === 401,
      `http ${staffPageAnon.status}`
    );

    const staffPageConsumer = await fetch(`${BASE}/lex/auth/agents`, {
      redirect: "manual",
      headers: { Cookie: cookieHeader(jarB) },
    });
    const consumerStaffBlocked =
      staffPageConsumer.status === 307 ||
      staffPageConsumer.status === 302 ||
      staffPageConsumer.status === 401 ||
      staffPageConsumer.status === 403;
    record(
      "staff agents page blocked (consumer session)",
      consumerStaffBlocked,
      `http ${staffPageConsumer.status}`
    );

    await admin.from("agent_verifications").delete().eq("agent_id", dId);
    await admin.from("profiles").delete().eq("id", dId);
    await admin.auth.admin.deleteUser(dId);
    record("disposable cleanup", true, disposableEmail);
  }

  // --- Case C: prior rejection blocks auto-approve ---
  const rejectEmail = `qa.smoke.rejected.${Date.now()}@yike.ng`;
  const rejectPin = String(randomInt(100000, 999999));
  const rejectPhone = `0803199${String(randomInt(1000, 9999))}`;
  const { data: rejectUser, error: rejectCreateErr } = await admin.auth.admin.createUser({
    email: rejectEmail,
    password: rejectPin,
    email_confirm: true,
    user_metadata: { full_name: "QA Reject Smoke" },
  });
  if (rejectCreateErr || !rejectUser.user?.id) {
    record("prior-rejection disposable create", false, rejectCreateErr?.message || "no user");
  } else {
    const rId = rejectUser.user.id;
    await admin
      .from("profiles")
      .update({
        email_verified: true,
        full_name: "QA Reject Smoke",
        phone: rejectPhone,
        whatsapp: rejectPhone,
      })
      .eq("id", rId);
    await markPhoneVerifiedOperator(admin, rId, rejectPhone);
    await admin.from("agent_verifications").insert({
      agent_id: rId,
      user_id: rId,
      full_name: "QA Reject Smoke",
      phone: rejectPhone,
      email: rejectEmail,
      status: "rejected",
      nin_provider: "profile_review",
      submitted_at: new Date().toISOString(),
      rejection_reason: "Smoke test prior rejection seed",
    });

    const jarR = new Map();
    await loginWithDeviceTrust(rejectEmail, rejectPin, jarR, admin);
    const submitR = await submitSellerProfile(jarR, {
      residentialState: "Lagos",
      residentialAddress: "QA Smoke Test Address 12, Lekki",
      dateOfBirth: "1992-03-15",
      consentAccepted: true,
      accountType: "individual",
    });
    const pubR = redactBody(submitR.body);
    const verR = await latestVerification(admin, rId);
    const aiR = parseReviewNotes(verR?.verification_notes);
    record(
      "prior rejection → queued not auto-approved",
      submitR.res.ok &&
        pubR.autoApproved === false &&
        pubR.customerStatus === "checking" &&
        verR?.status === "pending" &&
        Boolean(aiR?.reasonCodes?.includes("prior_rejection")),
      `autoApproved=${pubR.autoApproved} codes=${aiR?.reasonCodes?.join(",") || "none"}`
    );

    await admin.from("agent_verifications").delete().eq("agent_id", rId);
    await admin.from("profiles").delete().eq("id", rId);
    await admin.auth.admin.deleteUser(rId);
  }

  // --- Age gate (API rejects underage before review) ---
  await resetQaSellerState(admin, qaId);
  await markPhoneVerifiedOperator(admin, qaId, qaPhone);
  const jarAge = new Map();
  await loginWithDeviceTrust(QA_EMAIL, qaPin, jarAge, admin);
  const underage = await submitSellerProfile(jarAge, {
    residentialState: "Lagos",
    residentialAddress: "QA Smoke Test Address 12, Lekki",
    dateOfBirth: "2015-06-01",
    consentAccepted: true,
    accountType: "individual",
  });
  record(
    "underage DOB rejected at API",
    underage.res.status === 400,
    `http ${underage.res.status}`
  );
  await resetQaSellerState(admin, qaId);

  // --- AI provider failure (engine-only; server AI flag off) ---
  const engineProc = spawnSync(
    "npx",
    ["tsx", "--test", "src/lib/__tests__/seller-profile-review-engine.test.ts"],
    { cwd: join(__dirname, ".."), encoding: "utf8", env: process.env }
  );
  record(
    "AI failure path (unit: provider error never auto-approves)",
    engineProc.status === 0,
    engineProc.status === 0 ? "seller-profile-review-engine.test.ts passed" : "unit test failed"
  );

  // Restore qa consumer-ish state (keep email verified; undo seller approval from case A)
  await resetQaSellerState(admin, qaId);
  if (qaBefore) {
    await admin
      .from("profiles")
      .update({
        phone_verified: qaBefore.phone_verified ?? false,
        phone_verified_at: qaBefore.phone_verified ? new Date().toISOString() : null,
        phone: qaBefore.phone ?? qaPhone,
        full_name: qaBefore.full_name ?? "Yike Sample User",
      })
      .eq("id", qaId);
  }

  record(
    "qa.signup restored (non-seller)",
    (await snapshotProfile(admin, qaId))?.role === "user",
    "role=user after cleanup"
  );

  console.log("\n--- Summary ---");
  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error("Smoke aborted:", e.message);
  process.exit(1);
});
