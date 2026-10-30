import { test, expect } from "@playwright/test";
import {
  agentAuthReady,
  agentAuthStatus,
  createLoggedInAgentContext,
  disposeAuthenticatedAgent,
  provisionAuthenticatedAgent,
  type AuthenticatedAgent,
} from "./helpers/authenticated-agent";

const ROUTES = [
  { vertical: "property", path: "/agent/listings/new/property" },
  { vertical: "vehicle", path: "/agent/listings/new/vehicle" },
  { vertical: "electronics", path: "/agent/listings/new/electronics" },
] as const;

test.describe.configure({ timeout: 120_000 });

test.describe("Listing catalogue selection UI", () => {
  let agent: AuthenticatedAgent | null = null;

  test.beforeAll(async () => {
    if (!agentAuthReady()) return;
    agent = await provisionAuthenticatedAgent();
  });

  test.afterAll(async () => {
    await disposeAuthenticatedAgent(agent);
  });

  for (const { vertical, path } of ROUTES) {
    test(`${vertical} — searchable catalogue controls render (mobile)`, async ({
      browser,
    }, testInfo) => {
      test.skip(!agentAuthReady(), agentAuthStatus().reason);
      test.skip(!agent, "Could not provision test agent — set E2E_EPHEMERAL_AUTH=1 with .env.e2e.local or E2E_AGENT_EMAIL/PASSWORD");

      const context = await createLoggedInAgentContext(browser, agent as AuthenticatedAgent);
      const page = await context.newPage();
      await page.setViewportSize({ width: 390, height: 844 });

      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });

      const smart = page.locator("#le-smart-describe");
      await expect(smart).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('[id^="le-"]').first()).toBeVisible();

      await page.screenshot({
        path: testInfo.outputPath(`${vertical}-listing-catalog-mobile.png`),
        fullPage: true,
      });

      await context.close();
    });
  }
});
