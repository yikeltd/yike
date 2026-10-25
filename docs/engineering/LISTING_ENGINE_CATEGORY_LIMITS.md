# Listing Engine — category coverage (2026-10)

## Supported for seller create/edit (`ListingEngine`)

| Category ID   | Manifest | Launch flag                    | Publish adapter        |
|---------------|----------|--------------------------------|------------------------|
| `property`    | Yes      | Always                         | `/api/agent/listings/create` |
| `vehicle`     | Yes      | `vehicle_marketplace`          | `/api/agent/vehicles/create` |
| `electronics` | Yes      | `electronics_marketplace`      | `/api/agent/electronics/create` |

## Not supported for creation (no manifest)

These IDs exist on `ListingCategoryId` for forward compatibility but **must not** show property-style forms:

`job`, `service`, `boat`, `agriculture`, `fashion`, `furniture`, `event`, `pet`, `business`

Existing rows in `properties` (or other tables) and staff tools are unchanged. Adding a vertical requires a manifest, adapter, and API — not a wizard fallback.

## Draft persistence

- **Storage:** browser `localStorage` only (`yike_engine_listing_draft_v2:{categoryId}:{agentId}`).
- **Scope:** new listings per agent + category; edit flows (`listingId` set) do not autosave over server data.
- **Not server drafts:** no new DB columns; server publish APIs remain authoritative.
