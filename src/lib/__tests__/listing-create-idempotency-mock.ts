import type { PropertiesInsertClient } from "@/lib/listing-create/idempotency";

export function createMockPropertiesInsertClient(): {
  client: PropertiesInsertClient;
  rows: Map<string, Record<string, unknown>>;
} {
  const rows = new Map<string, Record<string, unknown>>();

  function rowSnapshot(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      slug: "slug",
      status: "pending",
      agent_id: row.agent_id,
      asset_type: row.asset_type,
      extras: row.extras ?? null,
      title: row.title,
      price: row.price,
      state: row.state,
      city: row.city,
      media_urls: row.media_urls,
      listing_type: row.listing_type,
      property_type: row.property_type,
      bedrooms: row.bedrooms,
      make: row.make,
      model: row.model,
      year: row.year,
      auto_category: row.auto_category,
      vehicle_condition: row.vehicle_condition,
      condition: row.condition,
    };
  }

  const client = {
    from() {
      return {
        select() {
          return {
            eq(_col: string, id: string) {
              return {
                async maybeSingle() {
                  const row = rows.get(id);
                  return { data: row ? rowSnapshot(row) : null, error: null };
                },
                async single() {
                  const row = rows.get(id);
                  if (!row) {
                    return { data: null, error: { message: "not found" } };
                  }
                  return { data: rowSnapshot(row), error: null };
                },
              };
            },
          };
        },
        insert(row: Record<string, unknown>) {
          return {
            select() {
              return {
                async single() {
                  if (rows.has(String(row.id))) {
                    return {
                      data: null,
                      error: { message: "duplicate", code: "23505" },
                    };
                  }
                  rows.set(String(row.id), row);
                  return { data: rowSnapshot(row), error: null };
                },
              };
            },
          };
        },
      };
    },
  } as PropertiesInsertClient;

  return { client, rows };
}
