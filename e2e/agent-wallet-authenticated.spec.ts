import { test, expect } from "@playwright/test";
import {
  agentAuthReady,
  agentAuthStatus,
  createLoggedInAgentContext,
  disposeAuthenticatedAgent,
  provisionAuthenticatedAgent,
  type AuthenticatedAgent,
} from "./helpers/authenticated-agent";

test.describe.configure({ timeout: 120_000 });

test.describe("Authenticated agent wallet journey", () => {
  let agent: AuthenticatedAgent | null = null;

  test.beforeAll(async () => {
    if (!agentAuthReady()) return;
    agent = await provisionAuthenticatedAgent();
  });

  test.afterAll(async () => {
    await disposeAuthenticatedAgent(agent);
  });

  test.beforeEach(() => {
    test.skip(!agentAuthReady(), agentAuthStatus().reason);
    test.skip(!agent, "Could not provision ephemeral agent");
  });

  test("agent dashboard → wallet → back preserves session and balance UI", async ({
    browser,
  }) => {
    const session = agent as AuthenticatedAgent;
    const context = await createLoggedInAgentContext(browser, session);
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto("/agent", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });

    const walletLink = page.getByRole("link", {
      name: /Yike Coins wallet/i,
    });
    await expect(walletLink).toBeVisible({ timeout: 20_000 });
    await expect(walletLink).toHaveAttribute("href", "/account/coins?from=agent");

    await walletLink.click();
    await expect(page).toHaveURL(/\/account\/coins\?from=agent/, { timeout: 15_000 });

    const walletPage = page.getByTestId("yike-coins-wallet-page");
    await expect(walletPage).toBeVisible({ timeout: 15_000 });
    await expect(walletPage.getByText(/Available balance/i)).toBeVisible();
    await expect(page.locator("#wallet-balance")).toBeVisible();

    const backLink = walletPage.getByRole("link", {
      name: /Back to agent dashboard/i,
    });
    await expect(backLink).toHaveAttribute("href", "/agent");
    await backLink.click();
    await expect(page).toHaveURL(/\/agent(?:\?|$)/, { timeout: 15_000 });

    await context.close();
  });

});

test("unauthenticated wallet still redirects to login with return path", async ({
  page,
}) => {
  await page.goto("/account/coins?from=agent", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  const next = new URL(page.url()).searchParams.get("next");
  expect(next).toBe("/account/coins?from=agent");
});
