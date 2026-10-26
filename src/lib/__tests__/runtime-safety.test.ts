import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { supabaseProjectRefFromUrl } from "@/lib/dev/runtime-safety";

test("supabaseProjectRefFromUrl parses project host", () => {
  assert.equal(
    supabaseProjectRefFromUrl("https://hlpojfurfldvcxfxhveg.supabase.co"),
    "hlpojfurfldvcxfxhveg",
  );
  assert.equal(supabaseProjectRefFromUrl(""), null);
});

test("runtime safety module documents opt-in overrides", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/dev/runtime-safety.ts"),
    "utf-8",
  );
  assert.match(src, /YIKE_ALLOW_PRODUCTION_DB_IN_DEV/);
  assert.match(src, /YIKE_ALLOW_LIVE_PAYSTACK_IN_DEV/);
  assert.match(src, /sk_live_/);
});
