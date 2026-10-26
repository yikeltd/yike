import { test, expect, type Page } from "@playwright/test";
import {
  consumerAuthReady,
  consumerAuthStatus,
  createLoggedInConsumerContext,
  disposeAuthenticatedConsumer,
  provisionAuthenticatedConsumer,
  type AuthenticatedConsumer,
} from "./helpers/authenticated-consumer";

test.describe.configure({ timeout: 120_000 });

const PRIMARY_CATEGORIES: { label: string; id: string }[] = [
  { label: "Cars", id: "car" },
  { label: "SUVs", id: "suv" },
  { label: "Pickups", id: "pickup_van" },
  { label: "Buses", id: "bus_minibus" },
  { label: "Motorcycles", id: "motorcycle_tricycle" },
];

async function openVehicleMobileFilters(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?category=vehicle", {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  const hero = page.locator("section.home-hero-mobile");
  await expect(hero).toBeVisible({ timeout: 45_000 });
  const vehiclesTab = hero.getByRole("tab", { name: "Vehicles" });
  if ((await vehiclesTab.getAttribute("aria-selected")) !== "true") {
    await vehiclesTab.click();
    await page.waitForURL(/category=vehicle/, { timeout: 20_000 });
  }
  await hero.getByTestId("home-mobile-filters-toggle").click();
  await expect(hero.getByTestId("home-mobile-filters-expanded")).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("Vehicle primary categories — browse search", () => {
  for (const { label, id } of PRIMARY_CATEGORIES) {
    test(`homepage vehicle search submits category=${id}`, async ({ page }) => {
      await openVehicleMobileFilters(page);
      const hero = page.locator("section.home-hero-mobile");
      await hero.getByRole("button", { name: "Category", exact: true }).click();
      await page.getByRole("option", { name: label }).click();
      await hero.getByRole("button", { name: "Search vehicles" }).click();
      await expect(page).toHaveURL(new RegExp(`category=${id}`), { timeout: 20_000 });
    });
  }
});

test.describe("Vehicle primary categories — listing wizard (auth)", () => {
  let consumer: AuthenticatedConsumer | null = null;

  test.beforeAll(async () => {
    if (!consumerAuthReady()) return;
    consumer = await provisionAuthenticatedConsumer();
  });

  test.afterAll(async () => {
    await disposeAuthenticatedConsumer(consumer);
  });

  test.beforeEach(() => {
    test.skip(!consumerAuthReady(), consumerAuthStatus().reason);
  });

  test("new vehicle wizard exposes five primary category options", async ({ browser }) => {
    const user = consumer as AuthenticatedConsumer;
    const context = await createLoggedInConsumerContext(browser, user);
    const page = await context.newPage();

    await page.goto("/agent/listings/new/vehicle", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });

    if (page.url().includes("/auth/login")) {
      await context.close();
      test.skip(true, "Session could not reach vehicle listing wizard");
    }

    const categoryTrigger = page
      .getByRole("button", {
        name: /Vehicle \/ equipment type|Category|auto_category/i,
      })
      .first();
    await expect(categoryTrigger).toBeVisible({ timeout: 30_000 });
    await categoryTrigger.click();

    for (const { label } of PRIMARY_CATEGORIES) {
      await expect(page.getByRole("option", { name: label })).toBeVisible();
    }

    await context.close();
  });
});
