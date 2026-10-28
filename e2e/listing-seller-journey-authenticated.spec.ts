import { test, expect } from "@playwright/test";
import {
  agentAuthReady,
  agentAuthStatus,
  createLoggedInAgentContext,
  disposeAuthenticatedAgent,
  provisionAuthenticatedAgent,
  type AuthenticatedAgent,
} from "./helpers/authenticated-agent";

test.describe.configure({ timeout: 180_000 });

test.describe("Authenticated seller listing journey", () => {
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
    test.skip(!agent, "Could not provision test agent");
  });

  test("electronics — instant workspace, smart describe, draft save", async ({
    browser,
  }, testInfo) => {
    const context = await createLoggedInAgentContext(browser, agent as AuthenticatedAgent);
    const page = await context.newPage();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/agent/listings/new?category=electronics", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByTestId("instant-listing-workspace")).toBeVisible({
      timeout: 20_000,
    });

    await expect(page.locator("#le-smart-describe")).toBeVisible({ timeout: 20_000 });

    const smartLine =
      "Samsung Galaxy A54 128GB foreign used Lagos Ikeja 680000";
    await page.locator("#le-smart-describe").fill(smartLine);
    await page.locator("#le-title").fill("E2E electronics draft title");

    await expect(page.locator("#le-title")).toHaveValue("E2E electronics draft title", {
      timeout: 15_000,
    });
    await expect(page.getByText(/Saved on this device/i)).toBeVisible({
      timeout: 30_000,
    });

    await page.screenshot({
      path: testInfo.outputPath("electronics-seller-journey-mobile.png"),
      fullPage: true,
    });

    await context.close();
  });

  test("property + vehicle wizards load on desktop", async ({ browser }, testInfo) => {
    const context = await createLoggedInAgentContext(browser, agent as AuthenticatedAgent);
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });

    for (const path of [
      "/agent/listings/new?category=property",
      "/agent/listings/new?category=vehicle",
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/auth\/login/);
      await expect(page.getByTestId("instant-listing-workspace")).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.locator("#le-smart-describe")).toBeVisible({ timeout: 20_000 });
    }

    await page.screenshot({
      path: testInfo.outputPath("property-vehicle-wizard-desktop.png"),
      fullPage: true,
    });

    await context.close();
  });
});
