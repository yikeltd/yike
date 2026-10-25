import { test, expect } from "@playwright/test";

const QUICK_USER_KEY = "yike_quick_user";

test.describe("Returning-user PIN login shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          userId: "00000000-0000-0000-0000-000000000099",
          email: "qa.signup@yike.ng",
          fullName: "QA Signup",
          username: null,
          avatarUrl: null,
        })
      );
    }, QUICK_USER_KEY);
  });

  test("returning-user login settles without legacy network-error copy", async ({ page }) => {
    await page.goto("/auth/login", {
      waitUntil: "networkidle",
      timeout: 60_000,
    });

    await expect
      .poll(
        async () => {
          const hasPasswordShell = await page.getByRole("heading", { name: "Welcome Back" }).count();
          const hasPinShell = await page.getByRole("heading", { name: "QA Signup" }).count();
          return hasPasswordShell + hasPinShell;
        },
        { timeout: 15_000 }
      )
      .toBeGreaterThan(0);

    await page.waitForTimeout(3_000);

    await expect(page.getByText(/network error\. try again/i)).toHaveCount(0);
  });

  test("preflight API responds within bounded time", async ({ page }) => {
    await page.goto("/auth/login", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const elapsedMs = await page.evaluate(async () => {
      const start = performance.now();
      const res = await fetch("/api/auth/pin/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "qa.signup@yike.ng" }),
      });
      await res.json();
      return performance.now() - start;
    });

    expect(elapsedMs).toBeLessThan(15_000);
  });
});
