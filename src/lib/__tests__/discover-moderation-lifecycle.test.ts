import assert from "node:assert/strict";
import test from "node:test";
import { buildDiscoverFeed } from "@/lib/discover/feed";
import { DEFAULT_DISCOVER_FILTERS } from "@/lib/discover/filters";
import {
  isDiscoverFeedCandidate,
  NEW_LISTING_MODERATION_STATUS,
  passesPublicListingQueryFilters,
} from "@/lib/listing-create/public-listing-eligibility";
import type { Property } from "@/types/database";

function row(partial: Partial<Property> & { id: string }): Property {
  const expires = new Date(Date.now() + 7 * 86_400_000).toISOString();
  return {
    title: "Test",
    price: 1_000_000,
    city: "Lagos",
    state: "Lagos",
    listing_type: "sale",
    property_type: "flat",
    media_urls: ["https://cdn.example/a.webp"],
    status: "approved",
    expires_at: expires,
    asset_type: "PROPERTY",
    availability_status: "available",
    ...partial,
  } as Property;
}

test("newly created listings start pending and are not public discover candidates", () => {
  assert.equal(NEW_LISTING_MODERATION_STATUS, "pending");
  const pending = row({ id: "p-pending", status: "pending" });
  assert.equal(passesPublicListingQueryFilters(pending), false);
  assert.equal(isDiscoverFeedCandidate(pending), false);
});

test("approved unexpired listings pass public query and discover candidate checks", () => {
  const approved = row({ id: "p-ok", status: "approved" });
  assert.equal(passesPublicListingQueryFilters(approved), true);
  assert.equal(isDiscoverFeedCandidate(approved), true);
});

test("expired approved listings are excluded from discover feed inputs", () => {
  const expired = row({
    id: "p-exp",
    status: "approved",
    expires_at: new Date(Date.now() - 86_400_000).toISOString(),
  });
  assert.equal(passesPublicListingQueryFilters(expired), false);
  const feed = buildDiscoverFeed([expired], [], DEFAULT_DISCOVER_FILTERS);
  assert.equal(feed.length, 0);
});

test("discover feed includes approved vertical rows when pools are pre-filtered like queryPublic*", () => {
  const property = row({ id: "p1", asset_type: "PROPERTY" });
  const vehicle = row({
    id: "v1",
    asset_type: "VEHICLE",
    auto_category: "car",
    property_type: undefined,
  });
  const electronics = row({
    id: "e1",
    asset_type: "ELECTRONICS",
    auto_category: "phones_tablets",
  });
  const pending = row({ id: "p2", status: "pending" });

  const publicProperties = [property].filter((r) => isDiscoverFeedCandidate(r));
  const publicVehicles = [vehicle].filter((r) => isDiscoverFeedCandidate(r));
  const publicElectronics = [electronics].filter((r) => isDiscoverFeedCandidate(r));

  assert.equal(publicProperties.length, 1);
  assert.equal(isDiscoverFeedCandidate(pending), false);

  const mixed = buildDiscoverFeed(
    publicProperties,
    publicVehicles,
    DEFAULT_DISCOVER_FILTERS,
    undefined,
    publicElectronics,
  );
  assert.ok(mixed.some((r) => r.id === "p1"));
  assert.ok(mixed.some((r) => r.id === "v1"));
  assert.ok(mixed.some((r) => r.id === "e1"));
});
