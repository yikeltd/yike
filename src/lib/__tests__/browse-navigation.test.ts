import test from "node:test";
import assert from "node:assert/strict";
import {
  BROWSE_RETURN_QUERY,
  buildBrowseReturnPath,
  coerceLoginNextForPortal,
  inferMarketplacePortal,
  listingHrefWithBrowseReturn,
  resolveBrowseBackTarget,
  resolveListingDetailBackFallback,
  scrollRetentionKey,
} from "@/lib/marketplace/browse-navigation";

test("inferMarketplacePortal distinguishes agent routes from consumer browse", () => {
  assert.equal(inferMarketplacePortal("/search"), "consumer");
  assert.equal(inferMarketplacePortal("/search?q=aba"), "consumer");
  assert.equal(inferMarketplacePortal("/agent/listings"), "agent");
  assert.equal(inferMarketplacePortal("/seller/crm"), "agent");
  assert.equal(inferMarketplacePortal("/properties/abc"), "consumer");
});

test("buildBrowseReturnPath preserves filters on browse surfaces", () => {
  assert.equal(
    buildBrowseReturnPath("/search", "marketplace=all&q=lagos"),
    "/search?marketplace=all&q=lagos"
  );
  assert.equal(buildBrowseReturnPath("/agent/listings", null), "/agent/listings");
  assert.equal(buildBrowseReturnPath("/lex/auth/overview", null), null);
});

test("listingHrefWithBrowseReturn encodes browseReturn query param", () => {
  const href = listingHrefWithBrowseReturn(
    { id: "p1", slug: "nice-flat", asset_type: "PROPERTY" },
    "/search?marketplace=all"
  );
  assert.match(href, /^\/properties\//);
  assert.match(href, new RegExp(`${BROWSE_RETURN_QUERY}=`));
});

test("resolveListingDetailBackFallback maps vertical detail paths to browse hubs", () => {
  assert.equal(
    resolveListingDetailBackFallback("/properties/nice-flat"),
    "/search"
  );
  assert.equal(
    resolveListingDetailBackFallback("/vehicles/toyota-camry"),
    "/vehicles"
  );
  assert.equal(
    resolveListingDetailBackFallback("/electronics/iphone-15"),
    "/electronics"
  );
  assert.equal(
    resolveListingDetailBackFallback("/agent/listings/edit"),
    "/agent/listings"
  );
});

test("resolveBrowseBackTarget prefers browseReturn param", () => {
  const target = resolveBrowseBackTarget(
    encodeURIComponent("/search?marketplace=all"),
    "/"
  );
  assert.equal(target, "/search?marketplace=all");
});

test("coerceLoginNextForPortal blocks cross-portal next when login started on browse", () => {
  const coerced = coerceLoginNextForPortal(
    "/search",
    "/agent/listings",
    "/"
  );
  assert.equal(coerced, "/search");
});

test("coerceLoginNextForPortal keeps explicit agent next without browse referer", () => {
  const kept = coerceLoginNextForPortal(
    "/",
    "/agent/listings/choose",
    "/"
  );
  assert.equal(kept, "/agent/listings/choose");
});

test("coerceLoginNextForPortal always allows public listing detail", () => {
  const kept = coerceLoginNextForPortal(
    "/search",
    "/properties/some-id",
    "/"
  );
  assert.equal(kept, "/properties/some-id");
});

test("scrollRetentionKey includes query string", () => {
  assert.equal(
    scrollRetentionKey("/search", "?marketplace=all"),
    "/search?marketplace=all"
  );
});
