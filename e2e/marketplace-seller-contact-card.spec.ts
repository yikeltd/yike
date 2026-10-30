import { test, expect } from "@playwright/test";

const DETAIL_ROUTES = [
  { path: "/properties", name: "property", hrefPrefix: "/properties/" },
  { path: "/vehicles", name: "vehicle", hrefPrefix: "/vehicles/" },
  { path: "/electronics", name: "electronics", hrefPrefix: "/electronics/" },
] as const;

test.describe("Listing detail seller profile section", () => {
  for (const { path, name, hrefPrefix } of DETAIL_ROUTES) {
    test(`${name} detail shows gallery contact and seller profile without duplicate CTAs`, async ({
      page,
    }) => {
      await page.goto(`${path}?limit=1`, { waitUntil: "domcontentloaded" });
      const listingLink = page.locator(`a[href^="${hrefPrefix}"]`).first();
      const hasListing = (await listingLink.count()) > 0;
      test.skip(!hasListing, `No ${name} listings in browse feed`);

      await listingLink.click();
      await page.waitForLoadState("domcontentloaded");

      const galleryContact = page.getByTestId("listing-detail-gallery-contact");
      if ((await galleryContact.count()) === 0) {
        test.skip(true, "Listing has no seller / gallery contact block");
      }
      await expect(galleryContact.getByRole("button", { name: /Message/i })).toBeVisible();

      const sellerSection = page.getByTestId("listing-detail-seller-section");
      await expect(sellerSection).toBeVisible();
      const sellerCard = sellerSection.getByTestId("marketplace-seller-contact-card");
      await expect(sellerCard).toBeVisible();
      await expect(sellerCard.getByRole("button", { name: /Message/i })).toHaveCount(0);
      await expect(sellerCard.getByRole("button", { name: /Call/i })).toHaveCount(0);
    });
  }
});
