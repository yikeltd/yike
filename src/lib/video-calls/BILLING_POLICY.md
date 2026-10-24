# Video call billing policy (implementation)

## Free allowance (default)

- **Ringing** — starting a call does not consume the daily free connected-video allowance.
- **Connected + `free_allowance`** — one session-scoped claim increments the Lagos-day counter exactly once (`counted = true` on `video_call_free_allowance_claims`).
- **Terminal without connect** — `declined`, `missed`, or `cancelled` while still `ringing`: no claim, no charge.
- **Terminal after free connect** — `failed`, `missed`, `declined`, or `cancelled` after `connected` with `billing_status = free_allowance`: server releases the session claim (idempotent).
- **Normal end** — `ended` after a free connected call keeps the consumed slot (call completed).

## Paid video (`coin_debit`)

- Paid overage requires **`platform_service_pricing.video_call_connected`** active with an approved `price_coins`. UI blocks billable preflight when price is missing (no invented prices).
- **Pre-connection failure** — connect or billing persistence failure runs `undoConnectionBilling` (coin reversal or free release as applicable).
- **Post-connection failure** — after a successful connect with `billing_status = coin_debit`, coins are **not** auto-refunded on `failed` / `missed` / `cancelled` finalize. Refunds require support/admin reversal or a future product-approved policy.

**Product decision pending:** whether short or failed paid connected calls should auto-credit coins on finalize (not implemented).

## Concurrency

- Only one `ringing → connected` transition wins billing.
- Finalize is idempotent per terminal status and refuses overwriting an existing terminal state with a different one.
