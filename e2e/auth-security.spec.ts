import { test, expect } from "@playwright/test";

test.describe("auth security API contracts", () => {
  test("PIN login rejects invalid payload", async ({ request }) => {
    const res = await request.post("/api/auth/pin/login", {
      data: { identifier: "test@example.com", pin: "123" },
    });
    expect(res.status()).toBe(400);
  });

  test("session unlock requires auth", async ({ request }) => {
    const res = await request.post("/api/auth/session/unlock", {
      data: { pin: "123456" },
    });
    expect(res.status()).toBe(401);
    expect(res.headers()["x-reauth"]).toBe("full");
  });

  test("PIN reset requires auth", async ({ request }) => {
    const res = await request.post("/api/auth/pin/reset", {
      data: { pin: "123456", password: "password123" },
    });
    expect(res.status()).toBe(401);
  });

  test("sensitive confirm requires auth", async ({ request }) => {
    const res = await request.post("/api/auth/sensitive/confirm", {
      data: { action: "change_password", password: "wrongpass" },
    });
    expect(res.status()).toBe(401);
  });

  test("bank change requires auth and step-up", async ({ request }) => {
    const res = await request.post("/api/ambassador/bank", {
      data: { bankCode: "058", accountNumber: "0123456789", accountName: "Test User" },
    });
    expect(res.status()).toBe(401);
  });

  test("env health is staff-only", async ({ request }) => {
    const res = await request.get("/api/admin/env-health");
    expect([401, 403]).toContain(res.status());
  });
});
