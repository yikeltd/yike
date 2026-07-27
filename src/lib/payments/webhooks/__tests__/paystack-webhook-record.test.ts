import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { recordPaystackWebhookEvent } from "@/lib/payments/webhooks/paystack-events";

type Row = {
  id: string;
  event_id: string | null;
  reference: string | null;
  status: string;
};

function mockAdmin(seed: Row[] = []) {
  const rows = [...seed];
  return {
    from(table: string) {
      assert.equal(table, "paystack_webhook_events");
      return {
        select() {
          return {
            eq(column: string, value: string) {
              const chain = {
                eq(column2: string, value2: string) {
                  return {
                    async maybeSingle() {
                      const hit = rows.find(
                        (r) =>
                          (r as Record<string, string | null>)[column] === value &&
                          (r as Record<string, string | null>)[column2] === value2,
                      );
                      return { data: hit ?? null };
                    },
                  };
                },
                async maybeSingle() {
                  const hit = rows.find(
                    (r) => (r as Record<string, string | null>)[column] === value,
                  );
                  return { data: hit ?? null };
                },
              };
              return chain;
            },
          };
        },
        insert(payload: Record<string, unknown>) {
          return {
            select() {
              return {
                async single() {
                  const id = `evt_${rows.length + 1}`;
                  rows.push({
                    id,
                    event_id: (payload.event_id as string | null) ?? null,
                    reference: (payload.reference as string | null) ?? null,
                    status: (payload.status as string) ?? "received",
                  });
                  return { data: { id }, error: null };
                },
              };
            },
          };
        },
      };
    },
    _rows: rows,
  };
}

describe("recordPaystackWebhookEvent idempotency", () => {
  it("flags duplicate by event_id", async () => {
    const admin = mockAdmin([
      { id: "1", event_id: "42", reference: "ref_a", status: "processed" },
    ]);
    const result = await recordPaystackWebhookEvent(admin as never, {
      eventId: "42",
      eventType: "charge.success",
      reference: "ref_a",
      payload: {},
    });
    assert.equal(result.duplicate, true);
    assert.equal(result.id, "1");
  });

  it("flags duplicate by processed reference", async () => {
    const admin = mockAdmin([
      { id: "2", event_id: "99", reference: "ref_b", status: "processed" },
    ]);
    const result = await recordPaystackWebhookEvent(admin as never, {
      eventId: "100",
      eventType: "charge.success",
      reference: "ref_b",
      payload: {},
    });
    assert.equal(result.duplicate, true);
  });

  it("inserts a new received event when unique", async () => {
    const admin = mockAdmin();
    const result = await recordPaystackWebhookEvent(admin as never, {
      eventId: "77",
      eventType: "charge.success",
      reference: "ref_new",
      payload: { event: "charge.success" },
    });
    assert.equal(result.duplicate, false);
    assert.ok(result.id);
    assert.equal(admin._rows.length, 1);
  });
});
