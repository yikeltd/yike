import { test, expect, type Page } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

function mobileHero(page: Page) {
  return page.locator("section.home-hero-mobile");
}

async function openMobileMarketplaceSearch(page: Page, category: "property" | "vehicle" | "electronics") {
  await page.goto(`/?category=${category}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  const hero = mobileHero(page);
  await expect(hero).toBeVisible({ timeout: 45_000 });
  const tabName =
    category === "vehicle" ? "Vehicles" : category === "electronics" ? "Electronics" : "Properties";
  const tab = hero.getByRole("tab", { name: tabName });
  if ((await tab.getAttribute("aria-selected")) !== "true") {
    await tab.click();
    await page.waitForURL(new RegExp(`category=${category}`), { timeout: 20_000 });
  }
  await hero.getByTestId("home-mobile-filters-toggle").click();
  await expect(hero.getByTestId("home-mobile-filters-expanded")).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("Mobile homepage marketplace filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test("vehicle filters collapse by default then activate after category", async ({ page }) => {
    await page.goto("/?category=vehicle", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.getByTestId("home-unified-search-bar")).toBeVisible({
      timeout: 45_000,
    });

    await openMobileMarketplaceSearch(page, "vehicle");

    const hero = mobileHero(page);
    await expect(hero.getByTestId("home-mobile-search-cta")).toHaveCount(0);
    await expect(hero.getByText(/Choose a vehicle type to set city/i)).toBeVisible();
    await expect(hero.getByRole("button", { name: "Make" })).toHaveCount(0);

    await hero.getByRole("button", { name: "Category", exact: true }).click();
    await page.getByRole("option", { name: "Cars" }).click();

    await expect(hero.getByRole("button", { name: "Make" })).toBeVisible();
    await expect(hero.getByRole("button", { name: "Budget" })).toBeVisible();
    await expect(page.getByTestId("home-unified-search-bar")).toBeVisible();
    await expect(hero.getByTestId("home-mobile-search-cta")).toBeVisible();

    await hero.getByRole("button", { name: "Search vehicles" }).click();
    await expect(page).toHaveURL(/\/vehicles\?.*category=car/, { timeout: 20_000 });
  });

  test("vehicle category can be changed before search", async ({ page }) => {
    await openMobileMarketplaceSearch(page, "vehicle");

    const hero = mobileHero(page);
    await hero.getByRole("button", { name: "Category", exact: true }).click();
    await page.getByRole("option", { name: "SUVs" }).click();
    await hero.getByRole("button", { name: "Category", exact: true }).click();
    await page.getByRole("option", { name: "Pickups" }).click();

    await hero.getByRole("button", { name: "Search vehicles" }).click();
    await expect(page).toHaveURL(/category=pickup_van/, { timeout: 20_000 });
  });

  test("property mobile filters gate location until deal chip selected", async ({ page }) => {
    await openMobileMarketplaceSearch(page, "property");

    const hero = mobileHero(page);
    await expect(hero.getByTestId("home-mobile-search-cta")).toHaveCount(0);
    await expect(hero.getByRole("button", { name: "Rent", exact: true })).toBeVisible();
    await expect(hero.getByRole("button", { name: "City" })).toHaveCount(0);

    await hero.getByRole("button", { name: "Rent", exact: true }).click();
    await expect(hero.getByRole("button", { name: "City" })).toBeVisible();
    await expect(hero.getByTestId("home-mobile-search-cta")).toBeVisible();

    await hero.getByRole("button", { name: "Search homes" }).click();
    await expect(page).toHaveURL(/\/search\?.*type=rent/, { timeout: 20_000 });
  });
});
