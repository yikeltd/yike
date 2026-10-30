import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

test("peer transfer RPC migration revokes authenticated execute", () => {
  const sql = fs.readFileSync(
    path.resolve(process.cwd(), "supabase/migrations/20261026120000_yc_transfers_admin_grants.sql"),
    "utf-8",
  );
  assert.match(sql, /yike_coin_peer_transfer/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.yike_coin_peer_transfer/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.yike_coin_peer_transfer.* TO service_role/);
  assert.match(sql, /yike_coin_admin_grant/);
});

test("transfer API requires Idempotency-Key and ignores client sender id", () => {
  const route = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/yike-coins/transfer/route.ts"),
    "utf-8",
  );
  assert.match(route, /Idempotency-Key/);
  assert.match(route, /executePeerYcTransfer/);
  assert.doesNotMatch(route, /body\.senderId/);
});

test("admin grant route requires super admin", () => {
  const route = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/admin/yike-coins/grant/route.ts"),
    "utf-8",
  );
  assert.match(route, /requireSuperAdminApi/);
  assert.match(route, /executeAdminYcGrant/);
});

test("username lookup selects only public profile fields", () => {
  const lookup = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/username/lookup.ts"),
    "utf-8",
  );
  assert.match(lookup, /select\("id, username, full_name, avatar_url, is_banned"\)/);
  assert.doesNotMatch(lookup, /select\("[^"]*email/);
});

test("username change guard migration blocks direct profile updates", () => {
  const sql = fs.readFileSync(
    path.resolve(process.cwd(), "supabase/migrations/20261026140000_profile_username_change_guard.sql"),
    "utf-8",
  );
  assert.match(sql, /yike_profile_guard_username_update/);
  assert.match(sql, /yike_profile_set_username/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.yike_profile_set_username/);
});

test("signup route uses shared username rules", () => {
  const signup = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/auth/signup/route.ts"),
    "utf-8",
  );
  assert.match(signup, /validateUsername/);
  assert.doesNotMatch(signup, /USERNAME_RE/);
});

test("ledger labels distinguish transfer grant and top-up", () => {
  const labels = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/yike-coins/ledger-labels.ts"),
    "utf-8",
  );
  assert.match(labels, /yc_transfer_out/);
  assert.match(labels, /admin_grant/);
  assert.match(labels, /wallet_topup/);
});
