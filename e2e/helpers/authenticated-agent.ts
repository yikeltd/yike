/**
 * Environment-gated Playwright agent sessions — isolated non-production Supabase only.
 */
import type { Browser, BrowserContext } from "@playwright/test";
import {
  createEphemeralAgentUser,
  deleteEphemeralUser,
  ephemeralAuthEnabled,
  type EphemeralAgentUser,
} from "./ephemeral-auth";
import { apiPasswordLogin } from "./qa-pin-login";
import { consumerAuthStatus } from "./authenticated-consumer";

export type AuthenticatedAgent = EphemeralAgentUser & { ephemeral: boolean };

export function agentAuthStatus(): { ready: boolean; reason: string } {
  if (ephemeralAuthEnabled()) {
    return {
      ready: true,
      reason: "E2E_EPHEMERAL_AUTH=1 with isolated Supabase + E2E_EXPECTED_REF match",
    };
  }
  const base = consumerAuthStatus();
  if (process.env.E2E_AGENT_EMAIL?.trim() && process.env.E2E_AGENT_PASSWORD?.trim()) {
    return {
      ready: true,
      reason: "E2E_AGENT_EMAIL and E2E_AGENT_PASSWORD are set",
    };
  }
  return {
    ready: false,
    reason: `${base.reason}; or set E2E_AGENT_EMAIL + E2E_AGENT_PASSWORD on isolated env`,
  };
}

export function agentAuthReady(): boolean {
  return agentAuthStatus().ready;
}

export async function provisionAuthenticatedAgent(): Promise<AuthenticatedAgent | null> {
  if (ephemeralAuthEnabled()) {
    const user = await createEphemeralAgentUser();
    if (!user) return null;
    return { ...user, ephemeral: true };
  }
  const email = process.env.E2E_AGENT_EMAIL?.trim();
  const password = process.env.E2E_AGENT_PASSWORD?.trim();
  if (email && password) {
    return { email, password, userId: "", ephemeral: false };
  }
  return null;
}

export async function createLoggedInAgentContext(
  browser: Browser,
  agent: AuthenticatedAgent,
): Promise<BrowserContext> {
  const context = await browser.newContext();
  await apiPasswordLogin(context.request, agent.email, agent.password);
  return context;
}

export async function disposeAuthenticatedAgent(agent: AuthenticatedAgent | null) {
  if (agent?.ephemeral && agent.userId && ephemeralAuthEnabled()) {
    await deleteEphemeralUser(agent.userId);
  }
}
