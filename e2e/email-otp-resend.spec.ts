import { test, expect } from "@playwright/test";

test.describe("Email OTP resend UX (mocked APIs)", () => {
  test("429 on send shows countdown and code-sent copy", async ({ page }) => {
    let sendCalls = 0;

    await page.route("**/api/auth/send-email-otp", async (route) => {
      sendCalls += 1;
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Please wait a moment before requesting another code.",
          retryAfterSec: 38,
          limitReason: "resend_cooldown",
        }),
      });
    });

    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          needsEmailVerify: true,
          profile: { id: "00000000-0000-0000-0000-000000000001", email: "qa.signup@yike.ng" },
        }),
      });
    });

    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });

    await page.locator('input[type="email"]').fill("qa.signup@yike.ng");
    await page.locator('input[autocomplete="current-password"]').fill("123456");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/code sent to/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/wait 38s/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /resend code in 38s/i })).toBeDisabled();

    expect(sendCalls).toBe(1);
  });
});
