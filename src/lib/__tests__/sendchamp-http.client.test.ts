import test from "node:test";
import assert from "node:assert/strict";
import { sendchampJsonPost } from "@/lib/notifications/providers/sendchamp-http.client";
import { isSendchampSuccess, sendchampErrorMessage } from "@/lib/notifications/providers/sendchamp-response";

test("sendchampJsonPost completes authenticated POST (no undici fetch failure)", async () => {
  const res = await sendchampJsonPost(
    "https://api.sendchamp.com/api/v1/verification/create",
    { channel: "sms", token_type: "numeric" },
    "invalid-access-key-for-test",
    8_000
  );
  assert.ok(res.status > 0, "expected HTTP status from Sendchamp");
  assert.equal(typeof res.data, "object");
});

test("Sendchamp 407 invalid access key is treated as failure", () => {
  const body = {
    code: 407,
    message: "Invalid Access Key",
    status: "failed",
    data: null,
  };
  assert.equal(isSendchampSuccess(body, false), false);
  assert.match(sendchampErrorMessage(body, 407), /Invalid Access Key/i);
});
