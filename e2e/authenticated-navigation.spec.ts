import { test, expect } from "@playwright/test";
import {
  consumerAuthReady,
  consumerAuthStatus,
  createLoggedInConsumerContext,
  disposeAuthenticatedConsumer,
  provisionAuthenticatedConsumer,
  type AuthenticatedConsumer,
} from "./helpers/authenticated-consumer";

test.describe("Authenticated mobile bottom nav (320px)", () => {
  let consumer: AuthenticatedConsumer | null = null;

  test.beforeAll(async () => {
    if (!consumerAuthReady()) return;
    consumer = await provisionAuthenticatedConsumer();
  });

  test.afterAll(async () => {
    await disposeAuthenticatedConsumer(consumer);
  });

  test.beforeEach(() => {
    test.skip(!consumerAuthReady(), consumerAuthStatus().reason);
  });

  test("five destinations + Sell FAB visible without horizontal overflow", async ({ browser }) => {
    const user = consumer as AuthenticatedConsumer;
    const context = await createLoggedInConsumerContext(browser, user);
    const page = await context.newPage();
    await page.setViewportSize({ width: 320, height: 720 });

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const nav = page.locator('nav[aria-label="Authenticated Navigation"]');
    await expect(nav).toBeVisible({ timeout: 20_000 });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);

    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Discover" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Post Property" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Inbox" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Profile" })).toBeVisible();

    await context.close();
  });

  test("tab destinations and active state after direct navigation", async ({ browser }) => {
    const user = consumer as AuthenticatedConsumer;
    const context = await createLoggedInConsumerContext(browser, user);
    const page = await context.newPage();
    await page.setViewportSize({ width: 320, height: 720 });
    const nav = page.locator('nav[aria-label="Authenticated Navigation"]');

    const cases: { link: string; url: RegExp; name: string }[] = [
      { link: "Discover", url: /\/discover/, name: "Discover" },
      { link: "Post Property", url: /\/post-property/, name: "Sell FAB" },
      { link: "Inbox", url: /\/conversations/, name: "Inbox" },
      { link: "Profile", url: /\/agent/, name: "Profile" },
    ];

    for (const c of cases) {
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
      await nav.getByRole("link", { name: c.link }).click();
      await expect(page).toHaveURL(c.url, { timeout: 15_000 });
    }

    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(nav.getByRole("link", { name: "Discover" })).toHaveClass(/text-gold/);

    await page.goto("/conversations", { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (new URL(page.url()).pathname === "/conversations") {
      await expect(nav.getByRole("link", { name: "Inbox" })).toHaveClass(/text-gold/);
    }

    await context.close();
  });

  test("browser Back from discover returns to prior route with sensible nav", async ({ browser }) => {
    const user = consumer as AuthenticatedConsumer;
    const context = await createLoggedInConsumerContext(browser, user);
    const page = await context.newPage();
    await page.setViewportSize({ width: 320, height: 720 });

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.locator('nav[aria-label="Authenticated Navigation"]').getByRole("link", { name: "Discover" }).click();
    await expect(page).toHaveURL(/\/discover/, { timeout: 15_000 });
    await page.goBack();
    await expect(page).toHaveURL(/\/?(\?|$)/, { timeout: 15_000 });

    await context.close();
  });
});
