import type { Page } from "@playwright/test";
import {
  sampleDetailPath,
  type SampleVertical,
} from "../../src/lib/sample-listings/showcase";

/** Stub slow native-contact probe so detail CTAs settle quickly in E2E. */
export async function stubNativeContactStatus(
  page: Page,
  body: { messagingAvailable: boolean; reason?: string | null } = {
    messagingAvailable: false,
    reason: null,
  },
) {
  await page.route(/\/api\/marketplace\/native-contact\/status/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

export async function waitForAuthReady(page: Page) {
  await page
    .waitForFunction(
      () => document.documentElement.dataset.authLoading === "0",
      { timeout: 20_000 },
    )
    .catch(() => undefined);
}

export async function gotoSampleListingDetail(
  page: Page,
  vertical: SampleVertical,
  variant: "withReviews" | "emptyReviews" = "withReviews",
) {
  await page.goto(sampleDetailPath(vertical, variant), {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
}

export function blockExternalLaunches(page: Page) {
  return page.addInitScript(() => {
    window.open = () => null;
  });
}
