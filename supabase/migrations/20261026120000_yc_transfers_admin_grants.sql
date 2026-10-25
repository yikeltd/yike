-- YC peer transfers and admin grants (atomic ledger mutations, service_role RPCs only)

CREATE TABLE IF NOT EXISTS public.yike_coin_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_reference TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_coins BIGINT NOT NULL CHECK (amount_coins > 0),
  sender_ledger_id UUID REFERENCES public.yike_coin_ledger(id) ON DELETE SET NULL,
  recipient_ledger_id UUID REFERENCES public.yike_coin_ledger(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT yike_coin_transfers_reference_unique UNIQUE (transfer_reference),
  CONSTRAINT yike_coin_transfers_idempotency_unique UNIQUE (idempotency_key),
  CONSTRAINT yike_coin_transfers_no_self CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS yike_coin_transfers_sender_idx
  ON public.yike_coin_transfers (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS yike_coin_transfers_recipient_idx
  ON public.yike_coin_transfers (recipient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.yike_coin_admin_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_reference TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_coins BIGINT NOT NULL CHECK (amount_coins > 0),
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) >= 3),
  ledger_id UUID REFERENCES public.yike_coin_ledger(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT yike_coin_admin_grants_reference_unique UNIQUE (grant_reference),
  CONSTRAINT yike_coin_admin_grants_idempotency_unique UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS yike_coin_admin_grants_recipient_idx
  ON public.yike_coin_admin_grants (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS yike_coin_admin_grants_actor_idx
  ON public.yike_coin_admin_grants (actor_id, created_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username_updated_at TIMESTAMPTZ;

-- Resolve recipient by exact username (case-insensitive); service-only.
CREATE OR REPLACE FUNCTION public.yike_resolve_profile_id_by_username(p_username text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id
  FROM public.profiles
  WHERE LOWER(username) = LOWER(NULLIF(TRIM(p_username), ''))
    AND username IS NOT NULL
    AND is_banned = FALSE
  LIMIT 1;
  RETURN v_id;
END;
$$;

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

  SELECT * INTO v_existing FROM public.yike_coin_transfers WHERE idempotency_key = p_idempotency_key;
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.sender_id <> p_sender_id
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

  v_recipient_id := public.yike_resolve_profile_id_by_username(p_recipient_username);
  IF v_recipient_id IS NULL THEN
    RAISE EXCEPTION 'recipient_not_found';
  END IF;
  IF v_recipient_id = p_sender_id THEN
    RAISE EXCEPTION 'self_transfer';
  END IF;

  v_reference := 'TRF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  SELECT * INTO v_debit FROM public.yike_coin_debit(
    p_sender_id,
    p_amount_coins,
    v_reference,
    p_idempotency_key || ':debit',
    'yc_transfer_out',
    'Sent YC to @' || LOWER(TRIM(p_recipient_username)),
    jsonb_build_object(
      'transfer_type', 'peer_send',
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
      v_reference,
      p_idempotency_key || ':credit',
      'yc_transfer_in',
      NULL,
      'Received YC from transfer ' || v_reference,
      jsonb_build_object(
        'transfer_type', 'peer_receive',
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
          'ROLLBACK-' || v_reference,
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

CREATE OR REPLACE FUNCTION public.yike_coin_admin_grant(
  p_actor_id uuid,
  p_recipient_id uuid,
  p_amount_coins bigint,
  p_reason text,
  p_idempotency_key text,
  p_grant_reference text
)
RETURNS TABLE (
  grant_id uuid,
  ledger_id uuid,
  balance_after bigint,
  already_applied boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.yike_coin_admin_grants%ROWTYPE;
  v_grant_id uuid;
  v_credit record;
BEGIN
  IF p_actor_id IS NULL OR p_recipient_id IS NULL THEN
    RAISE EXCEPTION 'invalid_participant';
  END IF;
  IF p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;
  IF p_grant_reference IS NULL OR btrim(p_grant_reference) = '' THEN
    RAISE EXCEPTION 'invalid_reference';
  END IF;
  IF p_amount_coins IS NULL OR p_amount_coins <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
  IF p_reason IS NULL OR char_length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'invalid_reason';
  END IF;

  SELECT * INTO v_existing FROM public.yike_coin_admin_grants WHERE idempotency_key = p_idempotency_key;
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.actor_id <> p_actor_id
       OR v_existing.recipient_id <> p_recipient_id
       OR v_existing.amount_coins <> p_amount_coins
       OR v_existing.grant_reference <> p_grant_reference THEN
      RAISE EXCEPTION 'idempotency_key_mismatch';
    END IF;
    SELECT balance_coins INTO balance_after FROM public.yike_coin_accounts WHERE user_id = p_recipient_id;
    RETURN QUERY SELECT v_existing.id, v_existing.ledger_id, balance_after, true;
    RETURN;
  END IF;

  SELECT * INTO v_credit FROM public.yike_coin_credit(
    p_recipient_id,
    p_amount_coins,
    p_grant_reference,
    p_idempotency_key,
    'admin_grant',
    NULL,
    'Admin YC grant: ' || trim(p_reason),
    jsonb_build_object(
      'grant_type', 'admin_supply',
      'admin_actor_id', p_actor_id,
      'grant_reference', p_grant_reference
    )
  );

  INSERT INTO public.yike_coin_admin_grants (
    grant_reference, idempotency_key, actor_id, recipient_id, amount_coins, reason, ledger_id
  )
  VALUES (
    p_grant_reference, p_idempotency_key, p_actor_id, p_recipient_id, p_amount_coins, trim(p_reason), v_credit.ledger_id
  )
  RETURNING id INTO v_grant_id;

  RETURN QUERY SELECT v_grant_id, v_credit.ledger_id, v_credit.balance_after, false;
END;
$$;

REVOKE ALL ON FUNCTION public.yike_resolve_profile_id_by_username(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_resolve_profile_id_by_username(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.yike_resolve_profile_id_by_username(text) TO service_role;

REVOKE ALL ON FUNCTION public.yike_coin_peer_transfer(uuid, text, bigint, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_coin_peer_transfer(uuid, text, bigint, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.yike_coin_peer_transfer(uuid, text, bigint, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.yike_coin_admin_grant(uuid, uuid, bigint, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_coin_admin_grant(uuid, uuid, bigint, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.yike_coin_admin_grant(uuid, uuid, bigint, text, text, text) TO service_role;

ALTER TABLE public.yike_coin_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yike_coin_admin_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY yike_coin_transfers_participant_read ON public.yike_coin_transfers
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY yike_coin_transfers_staff ON public.yike_coin_transfers
  FOR ALL USING (is_staff_admin());

CREATE POLICY yike_coin_admin_grants_recipient_read ON public.yike_coin_admin_grants
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY yike_coin_admin_grants_staff ON public.yike_coin_admin_grants
  FOR ALL USING (is_staff_admin());

COMMENT ON TABLE public.yike_coin_transfers IS 'Peer YC transfers linking sender/recipient ledger entries.';
COMMENT ON TABLE public.yike_coin_admin_grants IS 'Authorized admin YC grants (new supply) with actor audit.';
