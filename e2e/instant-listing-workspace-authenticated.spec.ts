import { test, expect } from "@playwright/test";
import { join } from "node:path";
import {
  agentAuthReady,
  agentAuthStatus,
  createLoggedInAgentContext,
  disposeAuthenticatedAgent,
  provisionAuthenticatedAgent,
  type AuthenticatedAgent,
} from "./helpers/authenticated-agent";

const CATEGORIES = [
  {
    id: "property",
    url: "/agent/listings/new?category=property",
    fieldProbe: "#le-listing_type, #le-property_type, [id^='le-']",
    verticalHeading: /Property details/i,
    smartLine: "Three-bedroom furnished flat for rent in Lekki Phase 1 Lagos 4.5m per year",
  },
  {
    id: "vehicle",
    url: "/agent/listings/new?category=vehicle",
    fieldProbe: "#le-smart-describe",
    verticalHeading: /Vehicle details/i,
    smartLine: "2019 Toyota Camry automatic 85000 km clean title Lagos Yaba 14.5m",
  },
  {
    id: "electronics",
    url: "/agent/listings/new?category=electronics",
    fieldProbe: "#le-smart-describe",
    verticalHeading: /Electronics details/i,
    smartLine: "Samsung Galaxy S24 Ultra 256GB excellent condition Abuja Gwarinpa 680000",
  },
] as const;

const FIXTURE_IMAGE = join(process.cwd(), "public/icons/logo.png");

test.describe.configure({ timeout: 180_000 });

test.describe("Authenticated instant listing workspace", () => {
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
    test.skip(!agent, agentAuthStatus().reason);
  });

  test("authenticated entry preserves category and hint via legacy choose URL", async ({
    browser,
  }) => {
    const context = await createLoggedInAgentContext(browser, agent as AuthenticatedAgent);
    const page = await context.newPage();
    await page.goto("/agent/listings/choose?category=vehicle&hint=toyota", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/agent\/listings\/new\?.*category=vehicle/, {
      timeout: 30_000,
    });
    await expect(page.getByTestId("instant-listing-workspace")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator("#le-smart-describe")).toHaveValue(/toyota/i, {
      timeout: 15_000,
    });
    await context.close();
  });

  for (const cat of CATEGORIES) {
    test(`${cat.id} — dynamic fields, smart-describe, draft (mobile)`, async ({
      browser,
    }, testInfo) => {
      const context = await createLoggedInAgentContext(browser, agent as AuthenticatedAgent);
      const page = await context.newPage();
      await page.setViewportSize({ width: 390, height: 844 });

      await page.goto(cat.url, { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("instant-listing-workspace")).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.locator(cat.fieldProbe).first()).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByRole("heading", { name: cat.verticalHeading })).toBeVisible({
        timeout: 20_000,
      });

      const smart = page.locator("#le-smart-describe");
      await smart.fill(cat.smartLine);
      await page.waitForTimeout(1200);

      const title = page.locator("#le-title");
      if (await title.isVisible()) {
        await title.fill("Seller locked title — do not overwrite");
        await smart.fill(cat.smartLine);
        await page.waitForTimeout(800);
        await expect(title).toHaveValue("Seller locked title — do not overwrite");
      }

      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(smart).toBeVisible({ timeout: 20_000 });

      await page.screenshot({
        path: testInfo.outputPath(`${cat.id}-workspace-mobile.png`),
        fullPage: true,
      });
      await context.close();
    });

    test(`${cat.id} — desktop layout and photo picker accepts file`, async ({
      browser,
    }, testInfo) => {
      const context = await createLoggedInAgentContext(browser, agent as AuthenticatedAgent);
      const page = await context.newPage();
      await page.setViewportSize({ width: 1280, height: 900 });

      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.goto(cat.url, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#le-smart-describe")).toBeVisible({ timeout: 20_000 });

      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached({ timeout: 15_000 });
      await fileInput.setInputFiles(FIXTURE_IMAGE);

      await page.waitForTimeout(1500);

      expect(consoleErrors.filter((e) => !e.includes("favicon"))).toEqual([]);

      await page.screenshot({
        path: testInfo.outputPath(`${cat.id}-workspace-desktop-photo.png`),
        fullPage: true,
      });
      await context.close();
    });
  }

  test("category combobox switches vertical in place", async ({ browser }) => {
    const context = await createLoggedInAgentContext(browser, agent as AuthenticatedAgent);
    const page = await context.newPage();
    await page.goto("/agent/listings/new?category=property", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("instant-listing-workspace")).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole("button", { name: "Listing category" }).click();
    await expect(page.getByRole("dialog", { name: "Listing category" })).toBeVisible({
      timeout: 10_000,
    });
    await page
      .getByRole("listbox", { name: "Listing category" })
      .getByRole("button", { name: /^Vehicles/i })
      .click();
    await expect(page).toHaveURL(/category=vehicle/);
    await expect(page.getByRole("heading", { name: /Vehicle details/i })).toBeVisible({
      timeout: 20_000,
    });
    await context.close();
  });
});
