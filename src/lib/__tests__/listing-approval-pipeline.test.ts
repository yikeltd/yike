import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  statusAfterAgentAction,
  isListingExpired,
  isListingPubliclyActive,
  canAgentReactivate,
} from "@/lib/listing-lifecycle";
import { invalidateListingCaches } from "@/lib/listing-approval";
import type { Property } from "@/types/database";

describe("Listing Approval Pipeline & Lifecycle Engine", () => {
  it("computes public activity status correctly for approved active listing", () => {
    const futureDate = new Date(Date.now() + 14 * 86_400_000).toISOString();
    const listing: Pick<Property, "status" | "expires_at" | "availability_status"> = {
      status: "approved",
      expires_at: futureDate,
      availability_status: "available",
    };

    assert.equal(isListingExpired(listing), false);
    assert.equal(isListingPubliclyActive(listing), true);
  });

  it("denies public activity status when listing is expired", () => {
    const pastDate = new Date(Date.now() - 86_400_000).toISOString();
    const listing: Pick<Property, "status" | "expires_at" | "availability_status"> = {
      status: "approved",
      expires_at: pastDate,
      availability_status: "available",
    };

    assert.equal(isListingExpired(listing), true);
    assert.equal(isListingPubliclyActive(listing), false);
  });

  it("handles agent action transitions atomically", () => {
    const property: Pick<Property, "status"> = { status: "approved" };

    const rentedResult = statusAfterAgentAction("mark_rented", property);
    assert.equal(rentedResult.status, "rented");
    assert.equal(rentedResult.availability_status, "rented");

    const soldResult = statusAfterAgentAction("mark_sold", property);
    assert.equal(soldResult.status, "archived");
    assert.equal(soldResult.availability_status, "sold");

    const reactivateResult = statusAfterAgentAction("reactivate", { status: "archived" });
    assert.equal(reactivateResult.status, "pending");
    assert.equal(reactivateResult.needsReview, true);
  });

  it("prevents self-reactivation of rejected or flagged listings", () => {
    assert.equal(canAgentReactivate({ status: "rejected" }).ok, false);
    assert.equal(canAgentReactivate({ status: "flagged" }).ok, false);
    assert.equal(canAgentReactivate({ status: "archived" }).ok, true);
  });

  it("invalidates all required ISR cache paths and tags", () => {
    const result = invalidateListingCaches({
      listingId: "test-listing-123",
      slug: "luxury-2-bed-ikeja",
      assetType: "VEHICLE",
    });

    assert.ok(result.revalidatedPaths.includes("/"));
    assert.ok(result.revalidatedPaths.includes("/properties"));
    assert.ok(result.revalidatedPaths.includes("/properties/luxury-2-bed-ikeja"));
    assert.ok(result.revalidatedPaths.includes("/cars"));
    assert.ok(result.revalidatedPaths.includes("/agent"));
    assert.ok(result.revalidatedPaths.includes("/agent/listings"));
    assert.ok(result.revalidatedTags.includes("properties"));
    assert.ok(result.revalidatedTags.includes("listings"));
    assert.ok(result.revalidatedTags.includes("vehicles"));
  });
});
