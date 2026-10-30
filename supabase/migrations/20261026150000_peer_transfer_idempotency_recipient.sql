-- Peer transfer: distinct debit/credit ledger references (-IN suffix) and idempotent replay
-- (sender, recipient, amount must match). Idempotent with 20261026142000 — ensures fresh
-- migration chains that include this version converge on the same function body as production.

CREATE OR REPLACE FUNCTION public.yike_coin_peer_transfer(
  p_sender_id uuid,
  p_recipient_username text,
  p_amount_coins bigint,
  p_idempotency_key text,
  p_note text DEFAULT NULL
)
RETURNS TABLE (
  transfer_id uuid,
  transfer_reference text,
  sender_ledger_id uuid,
  recipient_ledger_id uuid,
  sender_balance_after bigint,
  recipient_balance_after bigint,
  already_applied boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.yike_coin_transfers%ROWTYPE;
  v_recipient_id uuid;
  v_transfer_id uuid;
  v_reference text;
  v_credit_reference text;
  v_sender_ledger uuid;
  v_recipient_ledger uuid;
  v_sender_after bigint;
  v_recipient_after bigint;
  v_debit record;
  v_credit record;
BEGIN
  IF p_sender_id IS NULL THEN
    RAISE EXCEPTION 'invalid_sender';
  END IF;
  IF p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;
  IF p_amount_coins IS NULL OR p_amount_coins <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  v_recipient_id := public.yike_resolve_profile_id_by_username(p_recipient_username);
  IF v_recipient_id IS NULL THEN
    RAISE EXCEPTION 'recipient_not_found';
  END IF;
  IF v_recipient_id = p_sender_id THEN
    RAISE EXCEPTION 'self_transfer';
  END IF;

  SELECT * INTO v_existing FROM public.yike_coin_transfers WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.sender_id <> p_sender_id
       OR v_existing.recipient_id <> v_recipient_id
       OR v_existing.amount_coins <> p_amount_coins THEN
      RAISE EXCEPTION 'idempotency_key_mismatch';
    END IF;
    SELECT balance_coins INTO v_sender_after FROM public.yike_coin_accounts WHERE user_id = p_sender_id;
    SELECT balance_coins INTO v_recipient_after FROM public.yike_coin_accounts WHERE user_id = v_existing.recipient_id;
    RETURN QUERY SELECT
      v_existing.id,
      v_existing.transfer_reference,
      v_existing.sender_ledger_id,
      v_existing.recipient_ledger_id,
      v_sender_after,
      v_recipient_after,
      true;
    RETURN;
  END IF;

  v_reference := 'TRF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  v_credit_reference := v_reference || '-IN';

  SELECT * INTO v_debit FROM public.yike_coin_debit(
    p_sender_id,
    p_amount_coins,
    v_reference,
    p_idempotency_key || ':debit',
    'yc_transfer_out',
    'Sent YC to @' || LOWER(TRIM(p_recipient_username)),
    jsonb_build_object(
      'transfer_type', 'peer_send',
      'transfer_reference', v_reference,
      'counterparty_username', LOWER(TRIM(p_recipient_username)),
      'counterparty_user_id', v_recipient_id
    )
  );
  v_sender_ledger := v_debit.ledger_id;
  v_sender_after := v_debit.balance_after;

  BEGIN
    SELECT * INTO v_credit FROM public.yike_coin_credit(
      v_recipient_id,
      p_amount_coins,
      v_credit_reference,
      p_idempotency_key || ':credit',
      'yc_transfer_in',
      NULL,
      'Received YC from transfer ' || v_reference,
      jsonb_build_object(
        'transfer_type', 'peer_receive',
        'transfer_reference', v_reference,
        'counterparty_user_id', p_sender_id,
        'sender_id', p_sender_id
      )
    );
    v_recipient_ledger := v_credit.ledger_id;
    v_recipient_after := v_credit.balance_after;

    INSERT INTO public.yike_coin_transfers (
      transfer_reference, idempotency_key, sender_id, recipient_id,
      amount_coins, sender_ledger_id, recipient_ledger_id, note
    )
    VALUES (
      v_reference, p_idempotency_key, p_sender_id, v_recipient_id,
      p_amount_coins, v_sender_ledger, v_recipient_ledger, NULLIF(TRIM(p_note), '')
    )
    RETURNING id INTO v_transfer_id;

  EXCEPTION
    WHEN OTHERS THEN
      IF v_recipient_ledger IS NOT NULL THEN
        PERFORM public.yike_coin_debit(
          v_recipient_id,
          p_amount_coins,
          'ROLLBACK-' || v_credit_reference,
          p_idempotency_key || ':rollback_recipient',
          'yc_transfer_rollback',
          'Transfer failed — reversing recipient credit',
          jsonb_build_object('failed_transfer_reference', v_reference)
        );
      END IF;
      PERFORM public.yike_coin_reverse_debit(
        p_sender_id,
        p_idempotency_key || ':debit',
        p_idempotency_key || ':rollback_sender',
        'Transfer failed — reversing sender debit'
      );
      RAISE;
  END;

  RETURN QUERY SELECT
    v_transfer_id,
    v_reference,
    v_sender_ledger,
    v_recipient_ledger,
    v_sender_after,
    v_recipient_after,
    false;
END;
$$;

REVOKE ALL ON FUNCTION public.yike_coin_peer_transfer(uuid, text, bigint, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_coin_peer_transfer(uuid, text, bigint, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.yike_coin_peer_transfer(uuid, text, bigint, text, text) TO service_role;
