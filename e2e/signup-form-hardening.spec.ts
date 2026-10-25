import { test, expect } from "@playwright/test";

test.describe("Signup form hardening", () => {
  test("keeps submit disabled until the form passes local gates", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/signup");

    await expect(page.getByRole("heading", { name: /welcome to yike/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeDisabled();
  });

  test("debounced duplicate check does not flash errors for empty email", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/auth/signup");

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("a");
    await page.waitForTimeout(700);

    await expect(page.getByText(/email already in use/i)).toHaveCount(0);
  });
});
