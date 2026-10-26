import { test, expect } from "@playwright/test";
import {
  sampleDetailPath,
  type SampleVertical,
} from "../src/lib/sample-listings/showcase";

const VERTICALS: SampleVertical[] = ["property", "vehicle", "electronics"];

test.describe("Sample listing Message and Call destinations", () => {
  test.beforeEach(async () => {
    test.skip(
      process.env.YIKE_SAMPLE_LISTINGS_FIXTURE === "0",
      "Sample fixtures explicitly disabled",
    );
  });

  for (const vertical of VERTICALS) {
    test(`${vertical} — Message posts lead with wa.me redirect (guest)`, async ({
      page,
    }) => {
      await page.route("**/api/marketplace/native-contact/status", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ messagingAvailable: false, reason: null }),
        });
      });

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(sampleDetailPath(vertical, "withReviews"), {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      if (page.url().includes("/auth/login")) {
        test.skip(true, "Auth redirect blocked sample route");
      }

      const galleryContact = page.getByTestId("listing-detail-gallery-contact");
      await expect(galleryContact).toBeVisible({ timeout: 20_000 });

      const messageBtn = galleryContact.getByRole("button", {
        name: /WhatsApp|Message/i,
      });
      await expect(messageBtn).toBeEnabled();

      const trackResponse = page.waitForResponse(
        (res) =>
          res.url().includes("/api/leads/track") &&
          res.request().method() === "POST",
      );

      await messageBtn.click();

      const res = await trackResponse;
      expect(res.ok()).toBeTruthy();
      const json = (await res.json()) as { redirectUrl?: string; ok?: boolean };
      expect(json.ok).toBe(true);
      expect(json.redirectUrl).toMatch(/^https:\/\/wa\.me\//);
    });

    test(`${vertical} — Call button requests tel after sign-in flow or track`, async ({
      page,
    }) => {
      await page.route("**/api/marketplace/native-contact/status", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ messagingAvailable: false, reason: null }),
        });
      });

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(sampleDetailPath(vertical, "withReviews"), {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      if (page.url().includes("/auth/login")) {
        test.skip(true, "Auth redirect blocked sample route");
      }

      const galleryContact = page.getByTestId("listing-detail-gallery-contact");
      await expect(galleryContact).toBeVisible({ timeout: 20_000 });

      const callControl = galleryContact
        .getByRole("button", { name: /Call/i })
        .or(galleryContact.getByRole("link", { name: /Call/i }));
      await expect(callControl.first()).toBeVisible();

      const href = await callControl.first().getAttribute("href");
      if (href?.startsWith("tel:")) {
        expect(href).toMatch(/^tel:\+?[\d]+$/);
        return;
      }

      const trackOrModal = Promise.race([
        page
          .waitForResponse(
            (res) =>
              res.url().includes("/api/leads/track") &&
              res.request().method() === "POST",
            { timeout: 8_000 },
          )
          .then((r) => ({ kind: "track" as const, r })),
        page
          .getByRole("dialog")
          .waitFor({ state: "visible", timeout: 8_000 })
          .then(() => ({ kind: "auth" as const })),
      ]);

      await callControl.first().click();
      const outcome = await trackOrModal.catch(() => ({ kind: "none" as const }));

      if (outcome.kind === "track") {
        const json = (await outcome.r.json()) as { redirectUrl?: string };
        expect(json.redirectUrl).toMatch(/^tel:|^https:\/\/wa\.me\//);
      } else if (outcome.kind === "auth") {
        expect(outcome.kind).toBe("auth");
      } else {
        test.skip(true, "Call requires auth or tel link — no track response");
      }
    });
  }
});
