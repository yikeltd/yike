import { test, expect } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

const ELECTRONICS_SHORTCUTS = [
  { label: "Phones", param: "phones_tablets" },
  { label: "Laptops", param: "computers" },
  { label: "TVs", param: "tv_audio" },
  { label: "Home Appliances", param: "home_appliances" },
] as const;

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

  test("electronics: four shortcuts render in order with no All chip", async ({ page }) => {
    await page.goto("/?category=electronics", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const hero = page.locator("#home-desktop-search");
    await expect(hero).toBeVisible({ timeout: 45_000 });
    const chips = hero.getByTestId("home-desktop-electronics-category-chips");
    await expect(chips).toBeVisible();
    await expect(chips.getByRole("button")).toHaveCount(4);
    await expect(chips.getByRole("button", { name: "All", exact: true })).toHaveCount(0);
    await expect(chips.getByRole("button", { name: "Generators", exact: true })).toHaveCount(0);

    const labels = (await chips.getByRole("button").allTextContents()).map((s) => s.trim());
    expect(labels).toEqual(ELECTRONICS_SHORTCUTS.map((s) => s.label));
  });

  test("electronics: each shortcut submits the correct category param", async ({ page }) => {
    await page.goto("/?category=electronics", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const hero = page.locator("#home-desktop-search");
    await expect(hero).toBeVisible({ timeout: 45_000 });
    const chips = hero.getByTestId("home-desktop-electronics-category-chips");

    for (const { label, param } of ELECTRONICS_SHORTCUTS) {
      await page.goto("/?category=electronics", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await chips.getByRole("button", { name: label, exact: true }).click();
      const searchCta = hero.getByTestId("home-desktop-electronics-search-cta");
      await expect(searchCta).toBeVisible({ timeout: 10_000 });
      await searchCta.click();
      await expect(page).toHaveURL(new RegExp(`category=${param}`), { timeout: 20_000 });
    }
  });
});
