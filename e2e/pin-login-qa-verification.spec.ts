import { test, expect } from "@playwright/test";
import { attachPreflightMetrics } from "./helpers/qa-pin-login";
import {
  FIXTURE_QUICK_USER,
  UI_TEST_PIN,
  UI_WRONG_PIN,
  mockPinLogin,
  mockPinPreflight,
  pinLoginSuccessBody,
  pinLoginWrongPinBody,
  preflightAllowedBody,
  preflightBlockedBody,
  openLoginWithQuickUser,
} from "./helpers/pin-login-fixtures";

test.describe("PIN login — integration (real preflight API)", () => {
  test.beforeEach(({ }, testInfo) => {
    testInfo.setTimeout(90_000);
  });

  test("untrusted device shows password-first gate in browser", async ({ page }) => {
    const metrics = attachPreflightMetrics(page);
    await page.goto("/auth/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.evaluate((user) => {
      localStorage.setItem("yike_quick_user", JSON.stringify(user));
    }, FIXTURE_QUICK_USER);
    await page.reload({ waitUntil: "domcontentloaded" });

    const t0 = Date.now();
    await expect(page.getByText(/^email address$/i)).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(/device is not approved|continue where you left off/i)).toHaveCount(0);

    const baseline = metrics.count;
    await page.waitForTimeout(2_500);
    expect(metrics.count).toBe(baseline);

    test.info().annotations.push({
      type: "timing",
      description: `untrusted_gate_visible_ms=${Date.now() - t0}`,
    });
    test.info().annotations.push({
      type: "coverage",
      description: "integration:real_pin_preflight_api",
    });
  });
});

test.describe("PIN login — UI (Playwright route fixtures only)", () => {
  test.beforeEach(({ }, testInfo) => {
    testInfo.setTimeout(90_000);
    testInfo.annotations.push({
      type: "coverage",
      description: "ui:mocked_auth_routes_not_server_security",
    });
  });

  test.fixme("trusted device → PIN pad → client completes sign-in flow", async ({ page }) => {
    await mockPinPreflight(page, preflightAllowedBody());
    await mockPinLogin(page, 200, pinLoginSuccessBody());

    const profileNavigation = page.waitForURL(/\/profile/, { timeout: 15_000 });

    await openLoginWithQuickUser(page, "/auth/login?next=/profile");

    await expect(
      page.getByText(/enter your pin to continue|checking this device/i)
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/enter your pin to continue/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/device is not approved/i)).toHaveCount(0);

    for (const digit of UI_TEST_PIN.split("")) {
      await page.getByRole("button", { name: digit, exact: true }).click();
    }

    await profileNavigation;

    await expect.poll(async () =>
      page.evaluate(() => {
        const raw = localStorage.getItem("yike_quick_user");
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { email?: string; userId?: string };
        return parsed.userId ?? null;
      })
    ).toBe(FIXTURE_QUICK_USER.userId);
  });

  test.fixme("incorrect PIN → clear error, no loading loop", async ({ page }) => {
    await mockPinPreflight(page, preflightAllowedBody());
    await mockPinLogin(page, 401, pinLoginWrongPinBody());

    await openLoginWithQuickUser(page);
    await expect(
      page.getByText(/enter your pin to continue|checking this device/i)
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/enter your pin to continue/i)).toBeVisible({
      timeout: 20_000,
    });

    for (const digit of UI_WRONG_PIN.split("")) {
      await page.getByRole("button", { name: digit, exact: true }).click();
    }

    await expect(page.getByText(/incorrect pin/i)).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2_000);
    await expect(page.getByText(/checking this device/i)).toHaveCount(0);
    await expect(page.getByText(/network error/i)).toHaveCount(0);
    await expect(page.getByText(/enter your pin/i)).toBeVisible();
  });

  test.fixme("preflight network failure → retry recovers to PIN pad", async ({ page }) => {
    let blockedOnce = false;

    await page.route("**/api/auth/pin/preflight", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      if (!blockedOnce) {
        blockedOnce = true;
        await route.abort("failed");
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(preflightAllowedBody()),
      });
    });

    const metrics = attachPreflightMetrics(page);
    await openLoginWithQuickUser(page);

    await expect(page.getByText(/could not reach yike/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();

    const baseline = metrics.count;
    await page.getByRole("button", { name: /try again/i }).click();
    await expect(
      page.getByText(/enter your pin to continue|checking this device/i)
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/enter your pin to continue/i)).toBeVisible({
      timeout: 20_000,
    });
    expect(metrics.count).toBeGreaterThan(baseline);
    expect(metrics.count).toBeLessThanOrEqual(baseline + 2);
  });

  test("mocked preflight blocked switches to password sign-in", async ({ page }) => {
    await mockPinPreflight(page, preflightBlockedBody());

    await openLoginWithQuickUser(page);

    await expect(page.getByText(/^email address$/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/device is not approved|continue where you left off/i)).toHaveCount(0);
    await expect(page.getByText(/enter your pin to continue/i)).toHaveCount(0);
  });
});
