# Admin listing Delete (permanent soft-delete)

**Status:** Founder-approved · Lex moderation  
**Date:** 2026-07-26  
**API:** `POST /api/admin/listings/[id]/delete`  
**UI:** Quick moderation → **More actions** → 🗑 Delete

---

## Purpose

Remove listings that must not stay in the marketplace:

- Obvious scam / fraud / fake listings  
- Duplicate spam  
- Illegal or phishing content  
- Severe policy violations where Request edits / Reject / Hide are not enough  

Do **not** use Delete for fixable issues (missing photos, bad price, incomplete copy). Prefer Request edits, Hold, Reject, or Hide.

---

## Behavior (soft-delete)

Delete is **high-friction** and **not** a hard SQL `DELETE` of the property row.

1. Confirmation dialog (title + body below)  
2. Required reason + optional notes  
3. Admin PIN  
4. Sets `status = archived`, clears featured/boost, records `archived_*`  
5. Tags `media_assets.metadata` for deferred GC (`cleanup_eligible`) — files stay while the row is recoverable  
6. Writes immutable `audit_logs` action `listing.delete` (critical risk) with correlation ID  

Public marketplace, search, featured, feeds, and APIs already filter to `status = approved`, so the listing disappears immediately.

---

## Confirmation copy

- **Title:** Delete this listing permanently?  
- **Body:** This action permanently removes the listing from the marketplace. This cannot be undone.  
- **Reasons:** Spam · Fraud · Fake Listing · Illegal Content · Duplicate · Copyright Violation · Other  

---

## Permissions

| Role | Can Delete? |
|------|-------------|
| `super_admin` / `admin` | Yes |
| `moderator` / `content` / others | No (UI hidden; API `403`) |

Dealers, agents, vendors, and buyers never see this action.

---

## Audit record

Every successful delete writes `listing.delete` including:

- Admin ID / role  
- Listing ID + title  
- Seller (`agent_id`)  
- Reason (+ optional notes)  
- Timestamp (audit `created_at`)  
- IP hash (when available)  
- `metadata.correlation_id`  
- Soft-delete / media-tag flags  

Audit rows remain after the listing is archived.

---

## Recovery

Soft-delete rows remain in `properties`. Chief admins can restore via:

`POST /api/admin/listings/[id]/archive` with `{ "action": "restore" }`

(restore sets status back to `approved` and clears archive fields — review before re-publishing if fraud was involved).

Media is **not** hard-purged on Delete so recovery stays possible. Hard storage purge is a separate ops task after the retention window.

Database backups (Coolify / Supabase) remain the last-resort recovery path.

---

## Related actions (unchanged)

Approve · Reject · Hide · Feature · Hold · Flag · Rank lower · Ask update · Archive (ops) · Sample purge (demo rows only).
