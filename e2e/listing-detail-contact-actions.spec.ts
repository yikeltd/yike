import { test, expect } from "@playwright/test";
import type { SampleVertical } from "../src/lib/sample-listings/showcase";
import {
  blockExternalLaunches,
  gotoSampleListingDetail,
  stubNativeContactStatus,
  waitForAuthReady,
} from "./helpers/listing-contact-fixture";

const VERTICALS: SampleVertical[] = ["property", "vehicle", "electronics"];

test.describe.configure({ timeout: 90_000 });

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
      await stubNativeContactStatus(page);
      await blockExternalLaunches(page);

      let trackPayload: Record<string, unknown> | null = null;
      let trackCount = 0;
      page.on("request", (req) => {
        if (req.url().includes("/api/leads/track") && req.method() === "POST") {
          trackCount += 1;
          trackPayload = req.postDataJSON() as Record<string, unknown>;
        }
      });

      await page.setViewportSize({ width: 390, height: 844 });
      await gotoSampleListingDetail(page, vertical, "withReviews");
      if (page.url().includes("/auth/login")) {
        test.skip(true, "Auth redirect blocked sample route");
      }

      const galleryContact = page.getByTestId("listing-detail-gallery-contact");
      await expect(galleryContact).toBeVisible({ timeout: 25_000 });
      await waitForAuthReady(page);

      const messageBtn = galleryContact.getByRole("button", {
        name: /^Message\s+/i,
      });
      await expect(messageBtn).toBeEnabled({ timeout: 15_000 });
      await messageBtn.click();

      await expect
        .poll(() => trackPayload, { timeout: 45_000 })
        .not.toBeNull();
      expect(trackCount).toBe(1);

      expect(String(trackPayload!.leadType)).toBe("whatsapp");
      expect(String(trackPayload!.listingId)).toMatch(/^s3000001-/);

      const res = await page.request.post("/api/leads/track", {
        data: trackPayload,
      });
      const json = (await res.json()) as { redirectUrl?: string; ok?: boolean };
      expect(json.ok).toBe(true);
      expect(json.redirectUrl).toMatch(/^https:\/\/wa\.me\//);
    });

    test(`${vertical} — Call opens auth modal for guest with call intent`, async ({
      page,
    }) => {
      await stubNativeContactStatus(page);

      await page.setViewportSize({ width: 390, height: 844 });
      await gotoSampleListingDetail(page, vertical, "withReviews");
      if (page.url().includes("/auth/login")) {
        test.skip(true, "Auth redirect blocked sample route");
      }

      const galleryContact = page.getByTestId("listing-detail-gallery-contact");
      await expect(galleryContact).toBeVisible({ timeout: 25_000 });
      await waitForAuthReady(page);

      const callBtn = galleryContact.getByRole("button", {
        name: /^Call\s+/i,
      });
      await expect(callBtn).toBeVisible();
      await expect(callBtn).toBeEnabled();

      await callBtn.click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByRole("heading", { name: /Sign in to continue/i }),
      ).toBeVisible();

      const intent = await page.evaluate(() => {
        const raw = localStorage.getItem("yike_auth_intent");
        return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      });
      expect(intent?.type).toBe("call");
      expect(String(intent?.listingId)).toMatch(/^s3000001-/);
      expect(String(intent?.redirectPath ?? "")).toMatch(/sample-/);
    });
  }
});
