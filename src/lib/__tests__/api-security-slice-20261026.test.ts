import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isValidLeadReference } from "@/lib/leads/reference";

test("lead reference validation accepts canonical format only", () => {
  assert.equal(isValidLeadReference("YK-9D8FK2"), true);
  assert.equal(isValidLeadReference("yk-9d8fk2"), false);
  assert.equal(isValidLeadReference("YK-9D8FK"), false);
  assert.equal(isValidLeadReference("YK-9D8FK22"), false);
  assert.equal(isValidLeadReference("REF-123456"), false);
});

test("leads forward validates reference and idempotent handoff side effects", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/leads/forward/route.ts"),
    "utf8",
  );
  assert.match(src, /isValidLeadReference/);
  assert.match(src, /alreadyShared/);
  assert.match(src, /handoffSharedAt/);
});

test("trust passport route is launch-gated and validates user id", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/trust/passport/[userId]/route.ts"),
    "utf8",
  );
  assert.match(src, /isLaunchFeatureVisible\("passport_ui"\)/);
  assert.match(src, /isValidUuid/);
});

test("media upload route enforces listing ownership before storage write", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/media/upload/route.ts"),
    "utf8",
  );
  assert.match(src, /resolveStoragePropertyId/);
  assert.match(src, /agent_id !== params.userId/);
  assert.match(src, /Not allowed to upload for this listing/);
});

test("vehicle and electronics have no parallel public view metric API routes", () => {
  const apiRoot = join(process.cwd(), "src/app/api");
  const hits = ["vehicles", "electronics"].flatMap((vertical) => {
    try {
      readFileSync(join(apiRoot, vertical, "[id]", "view", "route.ts"), "utf8");
      return [vertical];
    } catch {
      return [];
    }
  });
  assert.deepEqual(hits, []);
});
