import { test, expect } from "@playwright/test";
import {
  agentAuthReady,
  agentAuthStatus,
  createLoggedInAgentContext,
  disposeAuthenticatedAgent,
  provisionAuthenticatedAgent,
  type AuthenticatedAgent,
} from "./helpers/authenticated-agent";
import {
  approveListingForPublicTest,
  countAgentListings,
  fetchListingRow,
  seedListingTestMediaUrls,
  uniqueIdempotencyKey,
} from "./helpers/listing-create-fixture";
import { buildPropertyCreateApiBody } from "@/lib/listing-create/property-api-body";

test.describe.configure({ timeout: 180_000 });

test.describe("Listing create persistence (isolated)", () => {
  let agent: AuthenticatedAgent | null = null;

  test.beforeAll(async () => {
    if (!agentAuthReady()) return;
    agent = await provisionAuthenticatedAgent();
  });

  test.afterAll(async () => {
    await disposeAuthenticatedAgent(agent);
  });

  test.beforeEach(() => {
    test.skip(!agentAuthReady(), agentAuthStatus().reason);
    test.skip(!agent, "Could not provision test agent");
  });

  test("property — create pending, idempotent replay, public after approval", async ({
    browser,
  }) => {
    const session = agent as AuthenticatedAgent;
    const context = await createLoggedInAgentContext(browser, session);
    const request = context.request;
    const media = await seedListingTestMediaUrls(session.userId);
    const idempotencyKey = uniqueIdempotencyKey("property");
    const beforeCount = await countAgentListings(session.userId);

    const body = buildPropertyCreateApiBody(
      {
        title: "E2E Property Flat Enugu",
        listing_type: "rent",
        property_type: "flat",
        bedrooms: 2,
        bathrooms: 1,
        state: "Enugu",
        city: "Enugu",
        area: "GRA",
        price: 1_200_000,
        payment_period: "yearly",
      },
      { mediaUrls: media, idempotencyKey },
    );

    const first = await request.post("/api/agent/listings/create", { data: body });
    expect(first.status()).toBe(200);
    const firstJson = (await first.json()) as { ok?: boolean; listingId?: string };
    expect(firstJson.ok).toBe(true);
    expect(firstJson.listingId).toBeTruthy();
    const listingId = firstJson.listingId!;

    const row = await fetchListingRow(listingId);
    expect(row?.agent_id).toBe(session.userId);
    expect(row?.asset_type).toBe("PROPERTY");
    expect(row?.status).toBe("pending");
    expect(await countAgentListings(session.userId)).toBe(beforeCount + 1);

    const replay = await request.post("/api/agent/listings/create", { data: body });
    expect(replay.status()).toBe(200);
    const replayJson = (await replay.json()) as { listingId?: string; idempotentReplay?: boolean };
    expect(replayJson.listingId).toBe(listingId);
    expect(replayJson.idempotentReplay).toBe(true);
    expect(await countAgentListings(session.userId)).toBe(beforeCount + 1);

    await approveListingForPublicTest(listingId);
    const page = await context.newPage();
    const slug = (await fetchListingRow(listingId))?.slug;
    expect(slug).toBeTruthy();
    const detail = await page.goto(`/properties/${slug}`, { waitUntil: "domcontentloaded" });
    expect(detail?.status()).toBeLessThan(400);
    await expect(page.getByText(/E2E Property Flat Enugu/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await context.close();
  });

  test("vehicle — create pending, idempotent replay, public after approval", async ({
    browser,
  }) => {
    const session = agent as AuthenticatedAgent;
    const context = await createLoggedInAgentContext(browser, session);
    const request = context.request;
    const media = await seedListingTestMediaUrls(session.userId);
    const idempotencyKey = uniqueIdempotencyKey("vehicle");
    const payload = {
      auto_category: "car",
      make: "Toyota",
      model: "Camry",
      year: 2019,
      vehicle_condition: "used",
      state: "Lagos",
      city: "Ikeja",
      title: "E2E Vehicle Camry Lagos",
      price: 14_500_000,
      media_urls: media,
      idempotencyKey,
    };

    const first = await request.post("/api/agent/vehicles/create", { data: payload });
    expect(first.status()).toBe(201);
    const firstJson = (await first.json()) as {
      ok?: boolean;
      listing?: { id: string; slug?: string; status?: string };
    };
    expect(firstJson.ok).toBe(true);
    const listingId = firstJson.listing?.id;
    expect(listingId).toBeTruthy();

    const row = await fetchListingRow(listingId!);
    expect(row?.agent_id).toBe(session.userId);
    expect(row?.asset_type).toBe("VEHICLE");
    expect(row?.status).toBe("pending");

    const replay = await request.post("/api/agent/vehicles/create", { data: payload });
    expect(replay.status()).toBe(200);
    const replayJson = (await replay.json()) as { idempotentReplay?: boolean; listing?: { id: string } };
    expect(replayJson.idempotentReplay).toBe(true);
    expect(replayJson.listing?.id).toBe(listingId);

    await approveListingForPublicTest(listingId!);
    const page = await context.newPage();
    const slug = (await fetchListingRow(listingId!))?.slug;
    const detail = await page.goto(`/vehicles/${slug}`, { waitUntil: "domcontentloaded" });
    expect(detail?.status()).toBeLessThan(400);
    await expect(page.getByText(/E2E Vehicle Camry Lagos/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await context.close();
  });

  test("electronics — create pending, idempotent replay, public after approval", async ({
    browser,
  }) => {
    const session = agent as AuthenticatedAgent;
    const context = await createLoggedInAgentContext(browser, session);
    const request = context.request;
    const media = await seedListingTestMediaUrls(session.userId);
    const idempotencyKey = uniqueIdempotencyKey("electronics");
    const payload = {
      auto_category: "phones_tablets",
      brand: "Samsung",
      model: "Galaxy A54",
      condition: "brand_new",
      state: "Abuja",
      city: "Gwarinpa",
      title: "E2E Electronics Samsung A54",
      price: 680_000,
      media_urls: media,
      idempotencyKey,
    };

    const first = await request.post("/api/agent/electronics/create", { data: payload });
    expect(first.status()).toBe(201);
    const firstJson = (await first.json()) as {
      ok?: boolean;
      listing?: { id: string; status?: string };
    };
    const listingId = firstJson.listing?.id;
    expect(listingId).toBeTruthy();

    const row = await fetchListingRow(listingId!);
    expect(row?.agent_id).toBe(session.userId);
    expect(row?.asset_type).toBe("ELECTRONICS");
    expect(row?.status).toBe("pending");

    const replay = await request.post("/api/agent/electronics/create", { data: payload });
    expect(replay.status()).toBe(200);
    const replayJson = (await replay.json()) as { idempotentReplay?: boolean };
    expect(replayJson.idempotentReplay).toBe(true);

    await approveListingForPublicTest(listingId!);
    const page = await context.newPage();
    const slug = (await fetchListingRow(listingId!))?.slug;
    const detail = await page.goto(`/electronics/${slug}`, { waitUntil: "domcontentloaded" });
    expect(detail?.status()).toBeLessThan(400);
    await expect(page.getByText(/E2E Electronics Samsung A54/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await context.close();
  });

  test("draft workspace does not insert listing row until publish", async ({ browser }) => {
    const session = agent as AuthenticatedAgent;
    const before = await countAgentListings(session.userId);
    const context = await createLoggedInAgentContext(browser, session);
    const page = await context.newPage();
    await page.goto("/agent/listings/new?category=property", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("instant-listing-workspace")).toBeVisible({ timeout: 20_000 });
    await page.locator("#le-title").fill("Draft-only title not published");
    await expect(page.getByText(/Saved on this device/i)).toBeVisible({ timeout: 30_000 });
    expect(await countAgentListings(session.userId)).toBe(before);
    await context.close();
  });
});
