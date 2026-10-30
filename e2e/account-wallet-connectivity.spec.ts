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
  browser,
}) => {
  const { agentAuthReady, agentAuthStatus, createLoggedInAgentContext, provisionAuthenticatedAgent, disposeAuthenticatedAgent } =
    await import("./helpers/authenticated-agent");
  test.skip(!agentAuthReady(), agentAuthStatus().reason);

  const agent = await provisionAuthenticatedAgent();
  test.skip(!agent, "Could not provision agent session");

  const context = await createLoggedInAgentContext(browser, agent!);
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  try {
    await page.goto("/agent", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
    const walletLink = page.getByRole("link", { name: /Yike Coins wallet/i });
    await expect(walletLink).toBeVisible({ timeout: 15_000 });
    await expect(walletLink).toHaveAttribute("href", "/account/coins?from=agent");
  } finally {
    await context.close();
    await disposeAuthenticatedAgent(agent);
  }
});
