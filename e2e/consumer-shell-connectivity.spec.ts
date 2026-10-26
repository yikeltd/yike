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

function loginNextIs(url: string, returnPath: string): boolean {
  if (new URL(url).pathname !== "/auth/login") return false;
  return new URL(url).searchParams.get("next") === returnPath;
}

test("wallet route redirects unauthenticated users to login with return path", async ({ page }) => {
  await page.goto("/account/coins", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  expect(loginNextIs(page.url(), "/account/coins")).toBeTruthy();
});

test("messages route redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/conversations", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page).toHaveURL(/\/auth\/login/);
  expect(loginNextIs(page.url(), "/conversations")).toBeTruthy();
});

test("conversation thread is gated (login next or messaging off → home)", async ({ page }) => {
  await page.goto("/conversations/test-thread-id", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  const url = page.url();
  const path = new URL(url).pathname;
  const loginWithNext = loginNextIs(url, "/conversations/test-thread-id");
  const messagingOffHome = path === "/";
  expect(loginWithNext || messagingOffHome).toBeTruthy();
});

test("320px public bottom nav fits five slots without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
  const bottomNav = page.locator('nav[aria-label="Public Navigation"]');
  await expect(bottomNav).toBeVisible();
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth > el.clientWidth + 1;
  });
  expect(overflow).toBe(false);
  await expect(bottomNav.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(bottomNav.getByRole("link", { name: "Discover listings" })).toBeVisible();
  await expect(bottomNav.getByRole("link", { name: "Saved" })).toBeVisible();
});
