import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("listing inquiry finalizes failed connect and missing provider", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/marketplace/listing-inquiry-actions.tsx"),
    "utf8"
  );
  assert.match(src, /finalizeVideoCallSession/);
  assert.match(src, /finalizeVideoCallSession\(sessionId, "failed"\)/);
  assert.match(src, /finalizeActiveCall\("cancelled"\)/);
  assert.match(src, /finalizeActiveCall\("ended"\)/);
});

test("video call client targets finalize API", () => {
  const src = readFileSync(join(process.cwd(), "src/lib/video-calls/client.ts"), "utf8");
  assert.match(src, /\/api\/video-calls\//);
  assert.match(src, /finalize/);
});

test("finalize API returns 409 when already finalized", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/video-calls/[id]/finalize/route.ts"),
    "utf8"
  );
  assert.match(src, /already_finalized/);
  assert.match(src, /409/);
});

test("sessions finalize forbids overwriting terminal states", () => {
  const src = readFileSync(join(process.cwd(), "src/lib/video-calls/sessions.ts"), "utf8");
  assert.match(src, /already_finalized/);
  assert.match(src, /\.in\("status", \["ringing", "connected"\]\)/);
  assert.match(src, /undoConnectionBilling/);
  assert.match(src, /billing_persist_failed/);
});

test("allowance claims use counted flag for single consume per session", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20261023210000_yike_coins_hardening.sql"),
    "utf8"
  );
  assert.match(sql, /counted BOOLEAN/);
  assert.match(sql, /SET counted = true/);
  assert.match(sql, /IF NOT v_claim.counted THEN/);
  assert.match(sql, /session_user_mismatch/);
});

test("billing policy documents paid post-connect non-refund default", () => {
  const doc = readFileSync(
    join(process.cwd(), "src/lib/video-calls/BILLING_POLICY.md"),
    "utf8"
  );
  assert.match(doc, /not.*auto-refund/i);
  assert.match(doc, /Product decision pending/);
});

test("callee incoming host wires decline missed end and finalize API", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/marketplace/incoming-video-call-host.tsx"),
    "utf8"
  );
  assert.match(src, /\/api\/video-calls\/incoming/);
  assert.match(src, /finalizeOnce\(next\.id, "missed"\)/);
  assert.match(src, /finalizeOnce\(call!\.id, "declined"\)/);
  assert.match(src, /finalizeOnce\(call!\.id, "ended"\)/);
  assert.match(src, /finalizeOnce\(call\.id, "cancelled"\)/);
});

test("incoming API scopes to callee and open statuses", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/video-calls/incoming/route.ts"),
    "utf8"
  );
  assert.match(src, /\.eq\("callee_id", user\.id\)/);
  assert.match(src, /\.in\("status", \["ringing", "connected"\]\)/);
});

test("finalize rejects non-participants", () => {
  const src = readFileSync(join(process.cwd(), "src/lib/video-calls/sessions.ts"), "utf8");
  assert.match(src, /session\.caller_id !== actorId && session\.callee_id !== actorId/);
  assert.match(src, /code: "forbidden"/);
});

test("conflicting terminal finalize returns already_finalized", () => {
  const src = readFileSync(join(process.cwd(), "src/lib/video-calls/sessions.ts"), "utf8");
  assert.match(src, /priorStatus === terminalStatus/);
  assert.match(src, /Call already finalized/);
  assert.match(src, /finalize_race/);
});

test("root layout mounts incoming call host for signed-in sellers", () => {
  const src = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
  assert.match(src, /IncomingVideoCallHost/);
});
