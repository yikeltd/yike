import test from "node:test";
import assert from "node:assert/strict";
import {
  checkIntegrationSupabaseTarget,
  parseIntegrationAllowlist,
  PRODUCTION_SUPABASE_REF,
} from "@/lib/testing/supabase-integration-target";

test("integration target blocks production ref even when flag is set", () => {
  const prev = { ...process.env };
  try {
    process.env.YIKE_DEV_DB_INTEGRATION = "1";
    process.env.E2E_EXPECTED_REF = PRODUCTION_SUPABASE_REF;
    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${PRODUCTION_SUPABASE_REF}.supabase.co`;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
    const result = checkIntegrationSupabaseTarget();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /production|allowlist/i);
    }
  } finally {
    process.env = prev;
  }
});

test("integration target requires allowlist match for disposable ref", () => {
  const prev = { ...process.env };
  const disposable = "abcd1234efgh5678ijkl";
  try {
    process.env.YIKE_DEV_DB_INTEGRATION = "1";
    process.env.E2E_EXPECTED_REF = disposable;
    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${disposable}.supabase.co`;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
    const result = checkIntegrationSupabaseTarget();
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.ref, disposable);
  } finally {
    process.env = prev;
  }
});

test("parseIntegrationAllowlist merges E2E_EXPECTED_REF and comma list", () => {
  const prev = { ...process.env };
  try {
    process.env.E2E_EXPECTED_REF = "aaa111";
    process.env.YIKE_INTEGRATION_ALLOWED_REFS = "bbb222, ccc333";
    const list = parseIntegrationAllowlist();
    assert.deepEqual(list.sort(), ["aaa111", "bbb222", "ccc333"]);
  } finally {
    process.env = prev;
  }
});
