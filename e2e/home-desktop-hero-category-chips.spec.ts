import { test, expect } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

test.describe("Desktop hero category shortcut rows", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test("vehicles: primary category chips render", async ({ page }) => {
    await page.goto("/?category=vehicle", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const hero = page.locator("#home-desktop-search");
    await expect(hero).toBeVisible({ timeout: 45_000 });
    for (const label of ["All", "Cars", "SUVs", "Pickups", "Buses", "Motorcycles"]) {
      await expect(hero.getByRole("button", { name: label, exact: true })).toBeVisible();
    }
  });

  test("properties: deal chips render", async ({ page }) => {
    await page.goto("/?category=property", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const hero = page.locator("#home-desktop-search");
    await expect(hero).toBeVisible({ timeout: 45_000 });
    for (const label of ["All", "Rent", "Buy", "Land"]) {
      await expect(hero.getByRole("button", { name: label, exact: true })).toBeVisible();
    }
  });

  test("electronics: category chips render and search submits category param", async ({
    page,
  }) => {
    await page.goto("/?category=electronics", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const hero = page.locator("#home-desktop-search");
    await expect(hero).toBeVisible({ timeout: 45_000 });
    const chips = hero.getByTestId("home-desktop-electronics-category-chips");
    await expect(chips).toBeVisible();
    await expect(chips.getByRole("button", { name: "All", exact: true })).toBeVisible();
    await expect(chips.getByRole("button", { name: "Generators", exact: true })).toBeVisible();
    await expect(chips.getByRole("button", { name: "Phones & Tablets", exact: true })).toBeVisible();

    await chips.getByRole("button", { name: "Generators", exact: true }).click();
    await hero.getByRole("button", { name: "Search electronics" }).click();
    await expect(page).toHaveURL(/\/electronics\?.*category=generators/, { timeout: 20_000 });

    await page.goto("/?category=electronics", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await hero.getByTestId("home-desktop-electronics-category-chips").getByRole("button", {
      name: "All",
      exact: true,
    }).click();
    await hero.getByRole("button", { name: "Phones & Tablets", exact: true }).click();
    await hero.getByRole("button", { name: "Search electronics" }).click();
    await expect(page).toHaveURL(/category=phones_tablets/, { timeout: 20_000 });
  });
});
