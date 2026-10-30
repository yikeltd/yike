import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

test.describe("listing-leads capture authorization", () => {
  test("rejects save lead without listingId", async ({ request }) => {
    const res = await request.post("/api/listing-leads/capture", {
      data: {
        leadType: "save",
        sellerId: randomUUID(),
      },
    });
    expect(res.status()).toBe(400);
  });

  test("rejects forged sellerId for random listing (no lead inserted)", async ({
    request,
  }) => {
    const listingId = randomUUID();
    const sellerId = randomUUID();
    const res = await request.post("/api/listing-leads/capture", {
      data: {
        leadType: "save",
        listingId,
        sellerId,
        listingTitle: "probe",
      },
    });
    expect(res.status()).toBe(404);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  test("rejects follow lead with listingId", async ({ request }) => {
    const res = await request.post("/api/listing-leads/capture", {
      data: {
        leadType: "follow",
        listingId: randomUUID(),
        sellerId: randomUUID(),
      },
    });
    expect(res.status()).toBe(400);
  });
});
