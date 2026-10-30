# Yike Coins — financial invariants

## Database (Postgres RPC, service_role only)

1. **Integer balances** — `yike_coin_accounts.balance_coins` is `BIGINT` with `CHECK (balance_coins >= 0)`.
2. **Ledger immutability** — inserts only via `yike_coin_credit` / `yike_coin_debit`; unique `idempotency_key` and `reference`.
3. **Atomic debit** — account row locked `FOR UPDATE`; insufficient balance raises `insufficient_balance`.
4. **Idempotent replay** — duplicate idempotency key returns `already_applied=true` only when user, direction, amount, and reference match; otherwise `idempotency_key_mismatch`.
5. **Reversal** — `yike_coin_reverse_debit` credits exactly the original debit amount once per reversal idempotency key; replay validates `reverses_ledger_id` metadata.
6. **Video free allowance** — session-scoped claims + `yike_video_release_free_allowance`; consumption only after winning `ringing → connected` claim; terminal failed/declined/missed/cancelled releases free slots.
7. **RLS** — users read own balance/ledger; mutations only through service role (RPC grants revoked from `PUBLIC` / `authenticated`).

## Application

1. **Prices** — resolved server-side (`platform_service_pricing`, revenue pricing, top-up denominations); client amounts ignored.
2. **Purchases** — `purchaseWithYikeCoins`: debit → entitlement row → deliver → reverse on delivery failure.
3. **Paystack top-up** — fulfillment credits only after verified payment; order metadata marks `yike_coins_fulfilled`.
4. **Video connect billing** — pre-check balance while `ringing`; atomic status claim; then free slot or coin debit; rollback to `failed` if billing fails after claim.
5. **Separation** — `agent_wallets` (NGN lead billing) is independent of Yike Coins user accounts.
6. **Admin adjustments** — super-admin API only; unique `admin_adjust:{reference}` idempotency; immutable ledger + audit log.
7. **Peer transfers** — `yike_coin_peer_transfer` (service_role): atomic debit/credit; idempotency on transfer key; ledger codes `yc_transfer_out` / `yc_transfer_in`.
8. **Admin grants** — `yike_coin_admin_grant` + `yike_coin_admin_grants` audit; service code `admin_grant`; not peer transfer or Paystack top-up.
9. **Usernames** — case-insensitive unique index on `profiles`; transfers resolve recipient server-side by username.
