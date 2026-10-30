import test from "node:test";
import assert from "node:assert/strict";
import { sampleCatalogIdToDbUuid } from "@/lib/sample-listings/db-uuid";

test("sampleCatalogIdToDbUuid maps s-prefix catalog ids to valid hex UUIDs", () => {
  const dbId = sampleCatalogIdToDbUuid(
    "s3000001-0000-4000-8000-000000000001",
  );
  assert.match(
    dbId,
    /^a3000001-0000-4000-8000-000000000001$/,
  );
  assert.doesNotMatch(dbId, /^s/);
});
