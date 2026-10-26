import { test, expect } from "@playwright/test";
import {
  consumerAuthReady,
  consumerAuthStatus,
  createLoggedInConsumerContext,
  disposeAuthenticatedConsumer,
  provisionAuthenticatedConsumer,
  type AuthenticatedConsumer,
} from "./helpers/authenticated-consumer";
import {
  deleteMessagingUsers,
  isMessagingEnabledInBrowser,
  messagingFixtureStatus,
  seedMarketplaceConversation,
  type SeededConversation,
} from "./helpers/messaging-fixture";

function loginNextIs(url: string, returnPath: string): boolean {
  if (new URL(url).pathname !== "/auth/login") return false;
  return new URL(url).searchParams.get("next") === returnPath;
}

test.describe("Conversation thread navigation (unauthenticated)", () => {
  test("thread URL requires sign-in with return path when messaging is on", async ({ page }) => {
    await page.goto("/conversations/e2e-thread-gate", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const url = page.url();
    const path = new URL(url).pathname;
    const loginWithNext = loginNextIs(url, "/conversations/e2e-thread-gate");
    const messagingOffHome = path === "/";
    expect(loginWithNext || messagingOffHome).toBeTruthy();
  });
});

test.describe("Conversation thread navigation (authenticated)", () => {
  let seed: SeededConversation | null = null;
  let extraUserIds: string[] = [];

  test.beforeAll(async () => {
    const msg = await messagingFixtureStatus();
    if (!msg.ready) return;
    if (!consumerAuthReady()) return;
    seed = await seedMarketplaceConversation();
    if (seed) {
      extraUserIds = [seed.buyer.userId, seed.sellerId];
    }
  });

  test.afterAll(async () => {
    await deleteMessagingUsers(extraUserIds);
  });

  test.beforeEach(async () => {
    const msg = await messagingFixtureStatus();
    test.skip(!msg.ready, msg.reason);
    test.skip(!seed, "Could not seed marketplace conversation");
  });

  test("inbox → thread → Back to inbox → browser Back → refresh", async ({ browser }) => {
    const conversation = seed as SeededConversation;
    const consumer: AuthenticatedConsumer = {
      email: conversation.buyer.email,
      password: conversation.buyer.password,
      userId: conversation.buyer.userId,
      ephemeral: true,
    };

    const context = await createLoggedInConsumerContext(browser, consumer);
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });

    const messagingOn = await isMessagingEnabledInBrowser(page);
    test.skip(!messagingOn, "Messaging disabled in this environment (redirects away from /conversations)");

    await page.goto("/conversations", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible({ timeout: 20_000 });

    await page.getByRole("link", { name: /Listing / }).first().click();
    await expect(page).toHaveURL(new RegExp(`/conversations/${conversation.conversationId}`), {
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: "Back to inbox" })).toBeVisible();

    await page.getByRole("link", { name: "Back to inbox" }).click();
    await expect(page).toHaveURL(/\/conversations\/?$/, { timeout: 15_000 });

    await page.getByRole("link", { name: /Listing / }).first().click();
    await expect(page).toHaveURL(new RegExp(`/conversations/${conversation.conversationId}`));

    await page.goBack();
    await expect(page).toHaveURL(/\/conversations\/?$/, { timeout: 15_000 });

    const threadUrl = `/conversations/${conversation.conversationId}`;
    await page.goto(threadUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(new RegExp(threadUrl.replace("/", "\\/")));
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(new RegExp(threadUrl.replace("/", "\\/")));
    await expect(page.getByRole("link", { name: "Back to inbox" })).toBeVisible();
    expect(new URL(page.url()).pathname).not.toBe("/auth/login");

    await context.close();
  });
});

test.describe("Conversation inbox (authenticated consumer fixture)", () => {
  let consumer: AuthenticatedConsumer | null = null;

  test.beforeAll(async () => {
    if (!consumerAuthReady()) return;
    consumer = await provisionAuthenticatedConsumer();
  });

  test.afterAll(async () => {
    await disposeAuthenticatedConsumer(consumer);
  });

  test("signed-in user reaches inbox or messaging-off home without redirect loop", async ({ browser }) => {
    test.skip(!consumer, consumerAuthStatus().reason);
    const user = consumer as AuthenticatedConsumer;
    const context = await createLoggedInConsumerContext(browser, user);
    const page = await context.newPage();

    await page.goto("/conversations", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const path = new URL(page.url()).pathname;
    expect(path === "/conversations" || path === "/").toBeTruthy();
    if (path === "/conversations") {
      await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible({ timeout: 20_000 });
    }

    await context.close();
  });
});
