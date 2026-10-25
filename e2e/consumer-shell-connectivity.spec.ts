import { test, expect } from "@playwright/test";

const consumerChromeRoutes = ["/", "/discover", "/search", "/saved", "/vehicles", "/electronics"];

for (const path of consumerChromeRoutes) {
  test(`mobile bottom nav visible on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const bottomNav = page.locator('nav[aria-label="Public Navigation"], nav[aria-label="Authenticated Navigation"]');
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Home" })).toBeVisible();
  });
}

test("wallet route redirects unauthenticated users to login with return path", async ({ page }) => {
  await page.goto("/account/coins", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Faccount%2Fcoins/);
});

test("messages route redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/conversations", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fconversations/);
});
