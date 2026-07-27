import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildContext } from "@/lib/yip/context/build-context";
import { createTrustPlatform } from "@/lib/yip/capabilities/trust";
import { buildListingQualityCoach } from "@/lib/listing-quality";
import { resolveDealerBusinessType } from "@/lib/dealer/business-types";
import { resolveCarsSegment, resolveVehicleMake } from "@/lib/seo/vehicle-hubs";

describe("Phase 2B activation bridges", () => {
  it("maps dealer business types onto account types", () => {
    assert.equal(resolveDealerBusinessType("car_dealership")?.accountType, "dealer");
    assert.equal(resolveDealerBusinessType("property_agency")?.accountType, "agency");
    assert.equal(resolveDealerBusinessType("property_developer")?.accountType, "developer");
  });

  it("trust platform assesses listing context without throwing", () => {
    const platform = createTrustPlatform();
    const ctx = buildContext({
      domain: "vehicle",
      photoCount: 5,
      values: {
        listing: {
          id: "1",
          title: "Toyota Camry 2018",
          description: "Clean Lagos-used Camry with full service history and strong photos.",
          price: 12_000_000,
          city: "Lagos",
          listing_type: "sale",
          media_urls: ["a", "b", "c", "d"],
          is_verified_listing: true,
          created_at: new Date().toISOString(),
          contact_clicks: 2,
        },
      },
    });
    const assessment = platform.assess(ctx);
    assert.ok(["low", "medium", "high"].includes(assessment.score));
    assert.ok(assessment.signals.length > 0);
    assert.equal(platform.health().status, "healthy");
  });

  it("listing quality coach returns score and tips", () => {
    const coach = buildListingQualityCoach({
      title: "Test",
      description: "Short",
      price: 1_000_000,
      city: "Lagos",
      listing_type: "sale",
      media_urls: ["a"],
    });
    assert.ok(coach.score >= 0 && coach.score <= 100);
    assert.ok(coach.tips.some((t) => t.kind === "missing"));
    assert.ok(coach.estimatedImprovement > 0);
  });

  it("resolves car SEO make vs city segments", () => {
    assert.equal(resolveVehicleMake("toyota"), "Toyota");
    assert.equal(resolveCarsSegment("toyota")?.kind, "make");
    assert.equal(resolveCarsSegment("lagos")?.kind, "city");
  });
});
