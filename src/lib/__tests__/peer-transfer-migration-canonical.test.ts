/**
 * Static guard: peer-transfer migration SQL must keep -IN credit references and recipient idempotency.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = join(process.cwd(), "supabase/migrations");

const PEER_TRANSFER_FILES = [
  "20261026142000_peer_transfer_distinct_ledger_references.sql",
  "20261026150000_peer_transfer_idempotency_recipient.sql",
  "20261026151000_peer_transfer_restore_in_credit_reference.sql",
] as const;

const REQUIRED = [
  "v_credit_reference := v_reference || '-IN'",
  "IF FOUND THEN",
  "v_existing.recipient_id <> v_recipient_id",
  "p_idempotency_key || ':credit'",
  "v_credit_reference",
] as const;

/** Defective pattern: credit leg used bare v_reference (must use v_credit_reference). */
function creditsWithBareReference(sql: string): boolean {
  const idx = sql.indexOf("yike_coin_credit(");
  if (idx < 0) return false;
  const slice = sql.slice(idx, idx + 400);
  return (
    slice.includes("p_amount_coins,") &&
    slice.includes("v_reference,") &&
    !slice.includes("v_credit_reference,")
  );
}

for (const file of PEER_TRANSFER_FILES) {
  test(`peer transfer migration ${file} preserves canonical ledger + idempotency`, () => {
    const sql = readFileSync(join(root, file), "utf8");
    for (const fragment of REQUIRED) {
      assert.ok(sql.includes(fragment), `missing ${fragment} in ${file}`);
    }
    assert.ok(
      !creditsWithBareReference(sql),
      `${file} must not credit with bare v_reference (use v_credit_reference)`,
    );
  });
}
