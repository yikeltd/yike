import { test, expect } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

test("unauthenticated wallet redirects to login", async ({ page }) => {
  await page.goto("/account/coins", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
});

test("mobile wallet layout has no horizontal overflow on login gate", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/account/coins?from=agent", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth > el.clientWidth + 2;
  });
  expect(overflow).toBe(false);
});
