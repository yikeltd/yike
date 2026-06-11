import { createPrivateKey, createSign, randomUUID } from "crypto";
import type { SafeHavenAccessToken, SafeHavenConfig } from "./types";
import { logSafeHavenEvent } from "./logging";

function base64Url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createClientAssertion(config: SafeHavenConfig, tokenUrl: string): string | null {
  if (!config.clientId || !config.privateKeyPem) return null;

  try {
    const now = Math.floor(Date.now() / 1000);
    const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = base64Url(
      JSON.stringify({
        iss: config.clientId,
        sub: config.clientId,
        aud: tokenUrl,
        jti: randomUUID(),
        iat: now,
        exp: now + 300,
      })
    );
    const signingInput = `${header}.${payload}`;
    const key = createPrivateKey(config.privateKeyPem);
    const signature = createSign("RSA-SHA256").update(signingInput).sign(key);
    return `${signingInput}.${base64Url(signature)}`;
  } catch (err) {
    console.error("[safehaven_oauth_failed] client assertion", err);
    return null;
  }
}

let cachedToken: SafeHavenAccessToken | null = null;

export function clearSafeHavenTokenCache(): void {
  cachedToken = null;
}

export async function getSafeHavenAccessToken(
  config: SafeHavenConfig
): Promise<SafeHavenAccessToken | null> {
  if (!config.baseUrl || !config.clientId) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken;
  }

  const tokenUrl = `${config.baseUrl.replace(/\/$/, "")}${config.oauthTokenPath}`;
  logSafeHavenEvent("safehaven_oauth_started", { tokenUrl });

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");

  const assertion = createClientAssertion(config, tokenUrl);
  if (assertion) {
    body.set(
      "client_assertion_type",
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
    );
    body.set("client_assertion", assertion);
    body.set("client_id", config.clientId);
  } else if (config.clientSecret) {
    body.set("client_id", config.clientId);
    body.set("client_secret", config.clientSecret);
  } else {
    logSafeHavenEvent("safehaven_oauth_failed", { reason: "missing_assertion_or_secret" });
    return null;
  }

  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: AbortSignal.timeout(25_000),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      logSafeHavenEvent("safehaven_oauth_failed", {
        status: res.status,
        error: typeof data.error === "string" ? data.error : "oauth_failed",
      });
      return null;
    }

    const accessToken = String(data.access_token ?? "");
    if (!accessToken) {
      logSafeHavenEvent("safehaven_oauth_failed", { reason: "missing_access_token" });
      return null;
    }

    const expiresIn = Number(data.expires_in ?? 3600);
    cachedToken = {
      accessToken,
      expiresAt: Date.now() + Math.max(60, expiresIn) * 1000,
      tokenType: String(data.token_type ?? "Bearer"),
    };

    logSafeHavenEvent("safehaven_oauth_success", { expiresIn });
    return cachedToken;
  } catch (err) {
    logSafeHavenEvent("safehaven_oauth_failed", {
      reason: err instanceof Error ? err.message : "network_error",
    });
    return null;
  }
}
