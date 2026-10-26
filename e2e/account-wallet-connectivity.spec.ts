import { test, expect } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

function loginNextIs(url: string, returnPath: string): boolean {
  if (new URL(url).pathname !== "/auth/login") return false;
  return new URL(url).searchParams.get("next") === returnPath;
}

test("wallet from agent preserves login return path", async ({ page }) => {
  await page.goto("/account/coins?from=agent", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  expect(loginNextIs(page.url(), "/account/coins?from=agent")).toBeTruthy();
});

test("agent dashboard requires authentication with return path", async ({ page }) => {
  await page.goto("/agent", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  expect(loginNextIs(page.url(), "/agent")).toBeTruthy();
});

test("desktop agent dashboard hero exposes wallet link with from=agent", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/agent", { waitUntil: "domcontentloaded", timeout: 60_000 });
  if (page.url().includes("/auth/login")) {
    test.skip(true, "BLOCKED: requires authenticated agent session");
  }
  const walletLink = page.getByRole("link", { name: /Yike Coins wallet/i });
  await expect(walletLink).toBeVisible({ timeout: 15_000 });
  await expect(walletLink).toHaveAttribute("href", "/account/coins?from=agent");
});
