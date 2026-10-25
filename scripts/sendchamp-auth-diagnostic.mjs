#!/usr/bin/env node
/**
 * Safe Sendchamp auth diagnostic — no secrets in output.
 * Usage: node scripts/sendchamp-auth-diagnostic.mjs
 * Loads .env.local via dotenv if available; otherwise uses process.env.
 */
import { readFileSync, existsSync } from "node:fs";
import { request as httpsRequest } from "node:https";

function loadDotEnvLocal() {
  const path = ".env.local";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function envMeta(name) {
  const raw = process.env[name];
  if (raw === undefined) {
    return { present: false, trimmedLength: 0, hasOuterWhitespace: false, prefix: null };
  }
  const trimmed = raw.trim();
  return {
    present: trimmed.length > 0,
    trimmedLength: trimmed.length,
    hasOuterWhitespace: raw !== trimmed,
    prefix: trimmed.length >= 8 ? `${trimmed.slice(0, 14)}…` : "(short)",
  };
}

function sendchampJsonPost(url, body, apiKey, timeoutMs) {
  const payload = JSON.stringify(body);
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: parsed.hostname,
        path: `${parsed.pathname}${parsed.search}`,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          let data = {};
          try {
            data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            data = { message: "non-json response" };
          }
          resolve({ status: res.statusCode ?? 0, data });
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function categorize(status, message) {
  const lower = String(message || "").toLowerCase();
  if (status === 401 || status === 407 || /invalid access key|unauthorized/.test(lower)) {
    return "authentication";
  }
  if (status === 504 || /timeout|network/.test(lower)) return "network";
  if (status >= 200 && status < 300) return "ok";
  if (status >= 400) return "provider_rejection";
  return "unknown";
}

loadDotEnvLocal();

const baseUrl =
  process.env.SENDCHAMP_LIVE_BASE_URL?.trim() || "https://api.sendchamp.com/api/v1";
function isPlaceholderKey(key) {
  const lower = key.trim().toLowerCase();
  if (!lower || lower.length < 12) return true;
  return /your-sendchamp|your-.*-key|changeme|example|replace-me|xxx+|placeholder/.test(lower) || lower === "test";
}

const apiKey = process.env.SENDCHAMP_API_KEY?.trim();
const publicKey = process.env.SENDCHAMP_PUBLIC_KEY?.trim();
const apiUsable = apiKey && !isPlaceholderKey(apiKey) ? apiKey : null;
const publicUsable = publicKey && !isPlaceholderKey(publicKey) ? publicKey : null;
const activeKey = apiUsable || publicUsable;
const activeSource = apiUsable
  ? "SENDCHAMP_API_KEY"
  : publicUsable
    ? "SENDCHAMP_PUBLIC_KEY"
    : "none";

const report = {
  sendchampPublicKey: envMeta("SENDCHAMP_PUBLIC_KEY"),
  sendchampApiKey: envMeta("SENDCHAMP_API_KEY"),
  activeKeySource: activeSource,
  baseUrl,
  verificationCreateEndpoint: `${baseUrl}/verification/create`,
  authHeaderFormat: "Bearer <access-key>",
};

console.log(JSON.stringify({ phase: "config", ...report }, null, 2));

if (!activeKey) {
  console.log(JSON.stringify({ phase: "probe", skipped: true, reason: "no_key" }));
  process.exit(1);
}

try {
  const probe = await sendchampJsonPost(
    `${baseUrl}/verification/create`,
    {
      channel: "sms",
      token_type: "numeric",
      token_length: 6,
      expiration_time: 30,
      customer_mobile_number: "2348010000000",
      customer_email_address: "diagnostic@yike.ng",
      in_app_token: true,
      token: "000000",
      meta_data: { app: "Yike", purpose: "auth_diagnostic" },
      sender: "YIKE",
    },
    activeKey,
    25000
  );
  const message = String(probe.data.message ?? probe.data.status ?? "").slice(0, 120);
  console.log(
    JSON.stringify(
      {
        phase: "probe",
        httpStatus: probe.status,
        sanitizedMessage: message,
        failureCategory: categorize(probe.status, message),
        note: "in_app_token=true — no SMS dispatch",
      },
      null,
      2
    )
  );
} catch (err) {
  console.log(
    JSON.stringify(
      {
        phase: "probe",
        httpStatus: null,
        failureCategory: "network",
        sanitizedMessage: err instanceof Error ? err.message : "network error",
      },
      null,
      2
    )
  );
}
