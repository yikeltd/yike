import test from "node:test";
import assert from "node:assert/strict";
import { SAVED_EMPTY_BROWSE_HREF, CONSUMER_ROUTES } from "@/lib/navigation/consumer-routes";

test("guest and logged-in saved empty states share search browse href", () => {
  assert.equal(SAVED_EMPTY_BROWSE_HREF, "/search");
  assert.equal(SAVED_EMPTY_BROWSE_HREF, CONSUMER_ROUTES.search);
});
