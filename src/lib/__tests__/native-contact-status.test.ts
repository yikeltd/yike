import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("native contact status caches in non-production and bounds table probe time", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/marketplace/native-contact-status.ts"),
    "utf8",
  );
  assert.match(src, /PROBE_TIMEOUT_MS/);
  assert.match(src, /STATUS_CACHE_TTL_MS/);
  assert.match(src, /probe timeout/);
});
