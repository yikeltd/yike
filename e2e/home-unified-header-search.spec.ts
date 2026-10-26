import { test, expect } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

test.describe("Default unified header search", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test("mobile homepage shows pill search before filters open", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const bar = page.getByTestId("home-unified-search-bar");
    await expect(bar).toBeVisible({ timeout: 45_000 });
    await expect(bar.getByPlaceholder(/Search property, vehicles/i)).toBeVisible();
    await expect(page.getByTestId("home-unified-search-collapsed")).toHaveCount(0);
  });

  test("header sliders open in-flow hero filters without overlapping Latest", async ({
    page,
  }) => {
    await page.goto("/?category=property", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    const bar = page.getByTestId("home-unified-search-bar");
    await expect(bar).toBeVisible({ timeout: 45_000 });
    await bar.getByRole("button", { name: "Open filters" }).click();

    const hero = page.locator("#home-search");
    await expect(hero.getByTestId("home-mobile-filters-expanded")).toBeVisible({
      timeout: 15_000,
    });

    const latest = page.locator("section.home-latest-on-yike");
    await expect(latest).toBeVisible({ timeout: 30_000 });

    const heroBox = await hero.boundingBox();
    const latestBox = await latest.boundingBox();
    expect(heroBox).not.toBeNull();
    expect(latestBox).not.toBeNull();
    expect(latestBox!.y).toBeGreaterThanOrEqual(heroBox!.y + heroBox!.height - 8);
  });

  test("properties and vehicles filter toggles share test id", async ({ page }) => {
    for (const category of ["property", "vehicle"] as const) {
      await page.goto(`/?category=${category}`, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });
      const toggle = page.getByTestId("home-mobile-filters-toggle").first();
      await expect(toggle).toBeVisible({ timeout: 45_000 });
      const box = await toggle.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(43);
    }
  });
});
