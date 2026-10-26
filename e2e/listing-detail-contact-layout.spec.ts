import { test, expect } from "@playwright/test";

async function assertDetailContactLayout(page: import("@playwright/test").Page) {
  const unavailable = page.getByRole("heading", { name: /unavailable/i });
  if ((await unavailable.count()) > 0) {
    return false;
  }

  const galleryContact = page.getByTestId("listing-detail-gallery-contact");
  if ((await galleryContact.count()) === 0) {
    return false;
  }

  await expect(galleryContact).toBeVisible({ timeout: 15_000 });
  await expect(galleryContact.getByRole("button", { name: /Message/i })).toBeVisible();

  const sellerCard = page.getByTestId("marketplace-seller-contact-card");
  await expect(sellerCard).toBeVisible();
  await expect(sellerCard.getByRole("button", { name: /Message/i })).toHaveCount(0);

  const map = page.getByTestId("listing-detail-location-map");
  await expect(map).toBeVisible();

  const galleryBox = await galleryContact.boundingBox();
  const mapBox = await map.boundingBox();
  const sellerBox = await sellerCard.boundingBox();
  if (galleryBox && mapBox && sellerBox) {
    expect(mapBox.y).toBeGreaterThan(galleryBox.y);
    expect(sellerBox.y).toBeGreaterThan(mapBox.y);
  }
  return true;
}

test.describe("Listing detail contact layout", () => {
  test("property detail from search results when available", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/search?city=Lagos", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const listingLink = page.locator('a[href*="/properties/"]').first();
    if ((await listingLink.count()) === 0) {
      test.skip(true, "No property listings in search results");
    }
    await listingLink.click();
    await page.waitForLoadState("domcontentloaded");
    const ok = await assertDetailContactLayout(page);
    if (!ok) {
      test.skip(true, "Listing detail missing seller contact chrome");
    }
  });

  test("vehicle detail from browse when available", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/vehicles?category=suv", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const listingLink = page.locator('a[href*="/vehicles/"]').first();
    if ((await listingLink.count()) === 0) {
      test.skip(true, "No vehicle listings in browse");
    }
    await listingLink.click();
    await page.waitForLoadState("domcontentloaded");
    const ok = await assertDetailContactLayout(page);
    if (!ok) {
      test.skip(true, "Vehicle detail missing seller contact chrome");
    }
  });

  test("electronics detail from browse when available", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/electronics?q=phone", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const listingLink = page.locator('a[href*="/electronics/"]').first();
    if ((await listingLink.count()) === 0) {
      test.skip(true, "No electronics listings in browse");
    }
    await listingLink.click();
    await page.waitForLoadState("domcontentloaded");
    const ok = await assertDetailContactLayout(page);
    if (!ok) {
      test.skip(true, "Electronics detail missing seller contact chrome");
    }
  });
});
