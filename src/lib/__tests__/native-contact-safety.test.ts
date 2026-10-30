import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  publicListingAgentSelectSql,
  redactListingAgentContact,
} from "@/lib/marketplace/public-listing-agent";

test("public agent select omits phone fields when native contact server flag is on", () => {
  const prev = process.env.ENABLE_MARKETPLACE_NATIVE_CONTACT;
  process.env.ENABLE_MARKETPLACE_NATIVE_CONTACT = "true";
  try {
    const sql = publicListingAgentSelectSql();
    assert.doesNotMatch(sql, /\bphone\b/);
    assert.doesNotMatch(sql, /\bwhatsapp\b/);
  } finally {
    if (prev === undefined) delete process.env.ENABLE_MARKETPLACE_NATIVE_CONTACT;
    else process.env.ENABLE_MARKETPLACE_NATIVE_CONTACT = prev;
  }
});

test("redactListingAgentContact strips phone and whatsapp from agent payload", () => {
  const prev = process.env.ENABLE_MARKETPLACE_NATIVE_CONTACT;
  process.env.ENABLE_MARKETPLACE_NATIVE_CONTACT = "true";
  try {
    const listing = redactListingAgentContact({
      id: "listing-1",
      agent: {
        id: "seller-1",
        full_name: "Seller",
        phone: "08012345678",
        whatsapp: "08087654321",
      },
    } as import("@/types/database").Property);
    assert.equal((listing.agent as { phone?: string }).phone, undefined);
    assert.equal((listing.agent as { whatsapp?: string }).whatsapp, undefined);
  } finally {
    if (prev === undefined) delete process.env.ENABLE_MARKETPLACE_NATIVE_CONTACT;
    else process.env.ENABLE_MARKETPLACE_NATIVE_CONTACT = prev;
  }
});

test("listing inquiry actions probe native contact status before enabling CTAs", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/marketplace/listing-inquiry-actions.tsx"),
    "utf8"
  );
  assert.match(src, /native-contact\/status/);
  assert.match(src, /messagingDisabled/);
});

test("dev guard script requires canonical linked ref", () => {
  const src = readFileSync(
    join(process.cwd(), "scripts/verify-dev-supabase-target.mjs"),
    "utf8"
  );
  assert.match(src, /hlpojfurfldvcxfxhveg/);
  assert.match(src, /gyxemepnrkwxocgzfbeo/);
  assert.match(src, /--require-dev/);
});

test("communications migration revokes coin RPC from authenticated", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20261023210000_yike_coins_hardening.sql"),
    "utf8"
  );
  assert.match(sql, /REVOKE ALL ON FUNCTION public.yike_coin_debit/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public.yike_video_try_consume_free_allowance/);
  assert.match(sql, /TO service_role/);
});
