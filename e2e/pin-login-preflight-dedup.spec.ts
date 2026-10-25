import { test, expect } from "@playwright/test";
import { openLoginWithQuickUser } from "./helpers/pin-login-fixtures";

test.describe("PIN preflight request lifecycle", () => {
  test("does not spam preflight on remount-heavy load", async ({ page }) => {
    const preflightUrls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/auth/pin/preflight") && req.method() === "POST") {
        preflightUrls.push(req.url());
      }
    });

    await openLoginWithQuickUser(page);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({
      timeout: 20_000,
    });
    await page.waitForTimeout(500);

    expect(preflightUrls.length).toBeLessThanOrEqual(3);
  });
});
