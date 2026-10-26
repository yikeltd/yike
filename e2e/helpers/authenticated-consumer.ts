/**
 * Environment-gated Playwright consumer sessions — no hardcoded credentials.
 * @see e2e/helpers/ephemeral-auth.ts (E2E_EPHEMERAL_AUTH=1 + non-production Supabase)
 * @see E2E_CONSUMER_EMAIL + E2E_CONSUMER_PASSWORD for an explicit local test account
 */
import type { Browser, BrowserContext } from "@playwright/test";
import { randomBytes } from "node:crypto";
import {
  createEphemeralSavedEmptyUser,
  deleteEphemeralUser,
  ephemeralAuthEnabled,
  type EphemeralSavedUser,
} from "./ephemeral-auth";
import { apiPasswordLogin } from "./qa-pin-login";

export type ConsumerAuthMode = "ephemeral" | "explicit" | "unavailable";

export type ConsumerAuthStatus = {
  mode: ConsumerAuthMode;
  reason: string;
};

export function consumerAuthStatus(): ConsumerAuthStatus {
  if (ephemeralAuthEnabled()) {
    return {
      mode: "ephemeral",
      reason: "E2E_EPHEMERAL_AUTH=1 with non-production Supabase + service role",
    };
  }
  const email = process.env.E2E_CONSUMER_EMAIL?.trim();
  const password = process.env.E2E_CONSUMER_PASSWORD?.trim();
  if (email && password) {
    return {
      mode: "explicit",
      reason: "E2E_CONSUMER_EMAIL and E2E_CONSUMER_PASSWORD are set",
    };
  }
  return {
    mode: "unavailable",
    reason:
      "Set E2E_EPHEMERAL_AUTH=1 with non-production Supabase + SUPABASE_SERVICE_ROLE_KEY, or E2E_CONSUMER_EMAIL + E2E_CONSUMER_PASSWORD",
  };
}

export function consumerAuthReady(): boolean {
  return consumerAuthStatus().mode !== "unavailable";
}

export type AuthenticatedConsumer = {
  email: string;
  password: string;
  userId: string;
  /** Ephemeral users should be deleted in afterAll */
  ephemeral: boolean;
};

export async function provisionAuthenticatedConsumer(): Promise<AuthenticatedConsumer | null> {
  const status = consumerAuthStatus();
  if (status.mode === "ephemeral") {
    const user = await createEphemeralSavedEmptyUser();
    if (!user) return null;
    return { ...user, ephemeral: true };
  }
  if (status.mode === "explicit") {
    const email = process.env.E2E_CONSUMER_EMAIL!.trim();
    const password = process.env.E2E_CONSUMER_PASSWORD!.trim();
    return {
      email,
      password,
      userId: "",
      ephemeral: false,
    };
  }
  return null;
}

export async function createLoggedInConsumerContext(
  browser: Browser,
  consumer: AuthenticatedConsumer,
): Promise<BrowserContext> {
  const context = await browser.newContext();
  await loginConsumerRequestContext(context.request, consumer.email, consumer.password);
  return context;
}

export async function loginConsumerRequestContext(
  request: BrowserContext["request"],
  email: string,
  password: string,
): Promise<void> {
  await apiPasswordLogin(request, email, password);
}

export async function disposeAuthenticatedConsumer(consumer: AuthenticatedConsumer | null) {
  if (consumer?.ephemeral && consumer.userId) {
    await deleteEphemeralUser(consumer.userId);
  }
}

/** Tag for disposable seller/buyer pairs in messaging E2E */
export function ephemeralEmail(tag: string): string {
  const hex = randomBytes(6).toString("hex");
  return `e2e.${tag}+${hex}@ephemeral.yike.test`;
}

export type { EphemeralSavedUser };
