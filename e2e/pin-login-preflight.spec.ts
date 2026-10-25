import { test, expect } from "@playwright/test";

test.describe("PIN login preflight UX", () => {
  test("?mode=password shows password form despite quick-login localStorage", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "yike_quick_user",
        JSON.stringify({
          userId: "00000000-0000-0000-0000-000000000099",
          email: "qa.signup@yike.ng",
          fullName: "QA Signup",
          username: null,
          avatarUrl: null,
        })
      );
    });

    await page.goto("/auth/login?mode=password", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/checking this device/i)).toHaveCount(0);
    await expect(page.getByText(/^email address$/i)).toBeVisible();
  });

  test("preflight API blocks PIN on untrusted device", async ({ page }) => {
    await page.goto("/auth/login", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const preflightBody = await page.evaluate(async () => {
      const res = await fetch("/api/auth/pin/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "qa.signup@yike.ng" }),
      });
      return res.json() as Promise<{ canUsePin?: boolean; step?: string }>;
    });

    expect(preflightBody.canUsePin).toBe(false);
    expect(preflightBody.step).toBe("password");
  });
});
