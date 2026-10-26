import { test, expect } from "@playwright/test";

const FIXTURE_BANNER = /Sample listings \(dev fixture\)/i;

test.describe("Marketplace search results chrome", () => {
  test("property submitted search hides discovery form", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/search?city=Lagos", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByTestId("marketplace-discovery-search")).toHaveCount(0);
    await expect(page.getByText(FIXTURE_BANNER)).toHaveCount(0);
    await expect(
      page.locator('[data-testid="marketplace-discovery-search"] button[type="submit"]'),
    ).toHaveCount(0);
  });

  test("vehicles category browse hides discovery form", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/vehicles?category=suv", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByTestId("marketplace-discovery-search")).toHaveCount(0);
    await expect(page.getByText(FIXTURE_BANNER)).toHaveCount(0);
  });

  test("electronics submitted search uses refine panel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/electronics?q=samsung", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByTestId("electronics-discovery-search")).toHaveCount(0);
    await expect(page.getByTestId("electronics-refine-toggle")).toBeVisible();
    await expect(page.getByText(FIXTURE_BANNER)).toHaveCount(0);
  });

  test("electronics discovery keeps initial search form", async ({ page }) => {
    await page.goto("/electronics", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByTestId("electronics-discovery-search")).toBeVisible();
  });
});
