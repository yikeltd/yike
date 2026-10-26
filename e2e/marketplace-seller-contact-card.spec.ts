import { test, expect } from "@playwright/test";

const DETAIL_ROUTES = [
  { path: "/properties", name: "property" },
  { path: "/vehicles", name: "vehicle" },
  { path: "/electronics", name: "electronics" },
] as const;

test.describe("Marketplace seller contact card", () => {
  for (const { path, name } of DETAIL_ROUTES) {
    test(`${name} detail shows Message and Call on seller card when listing exists`, async ({
      page,
    }) => {
      await page.goto(`${path}?limit=1`, { waitUntil: "domcontentloaded" });
      const listingLink = page.locator(`a[href^="${path}/"]`).first();
      const hasListing = (await listingLink.count()) > 0;
      test.skip(!hasListing, `No ${name} listings in browse feed`);

      await listingLink.click();
      await page.waitForLoadState("domcontentloaded");

      const card = page.getByTestId("marketplace-seller-contact-card");
      const cardCount = await card.count();
      if (cardCount === 0) {
        test.skip(true, "Listing has no seller agent on card");
      }

      await expect(card.getByRole("button", { name: /Message/i })).toBeVisible();
      await expect(
        card.getByRole("button", { name: /Call/i }).or(card.getByRole("link", { name: /Call/i })),
      ).toBeVisible();

      await expect(card.getByText(/Safe Contact Protocol/i)).toHaveCount(0);
      await expect(card.getByText(/Make Offer/i)).toHaveCount(0);
      await expect(card.getByText(/Begin Escrow/i)).toHaveCount(0);
    });
  }
});
