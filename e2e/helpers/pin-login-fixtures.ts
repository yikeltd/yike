/**
 * Playwright-only PIN login fixtures — intercepts routes in the test browser.
 * Does not change production API routes or auth policy.
 */
import type { Page, Route } from "@playwright/test";
import { QA_SIGNUP_EMAIL } from "./qa-pin-login";

export const FIXTURE_QUICK_USER = {
  userId: "00000000-0000-0000-0000-000000000099",
  email: QA_SIGNUP_EMAIL,
  fullName: "QA Signup",
  username: "qa_signup_678",
  avatarUrl: null as string | null,
};

export const UI_TEST_PIN = "123456";
export const UI_WRONG_PIN = "000000";

export function preflightAllowedBody() {
  return {
    canUsePin: true,
    step: "pin",
    message: "Enter your PIN to continue",
  };
}

export function preflightBlockedBody() {
  return {
    canUsePin: false,
    step: "password",
    reason: "new_device",
    message: "This device is not approved. Sign in with your password first.",
  };
}

export function pinLoginSuccessBody() {
  return {
    ok: true,
    profile: {
      id: FIXTURE_QUICK_USER.userId,
      email: FIXTURE_QUICK_USER.email,
      full_name: FIXTURE_QUICK_USER.fullName,
      username: FIXTURE_QUICK_USER.username,
      avatar_url: null,
    },
  };
}

export function pinLoginWrongPinBody() {
  return {
    error: "Incorrect PIN. Try again or use your password.",
    pinLocked: false,
  };
}

export async function seedQuickUserOnPage(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem("yike_quick_user", JSON.stringify(user));
  }, FIXTURE_QUICK_USER);
}

/** Seed quick user then reload (same pattern as integration QA tests). */
export async function openLoginWithQuickUser(
  page: Page,
  loginPath = "/auth/login"
) {
  await page.goto(loginPath, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate((user) => {
    localStorage.setItem("yike_quick_user", JSON.stringify(user));
    window.dispatchEvent(new Event("yike-quick-user"));
  }, FIXTURE_QUICK_USER);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
}

export async function mockPinPreflight(page: Page, body: Record<string, unknown>) {
  await page.context().route("**/*", async (route: Route) => {
    const url = route.request().url();
    if (!url.includes("/api/auth/pin/preflight") || route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

export async function mockPinLogin(page: Page, status: number, body: Record<string, unknown>) {
  await page.context().route("**/*", async (route: Route) => {
    const url = route.request().url();
    if (!url.includes("/api/auth/pin/login") || route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}
