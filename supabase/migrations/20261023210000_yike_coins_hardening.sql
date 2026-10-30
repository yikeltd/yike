-- Hardening: RPC auth, purchase entitlements, atomic video free allowance, explicit revokes

REVOKE ALL ON FUNCTION public.yike_ensure_coin_account(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_coin_credit(uuid, bigint, text, text, text, uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_coin_debit(uuid, bigint, text, text, text, text, jsonb) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.yike_ensure_coin_account(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.yike_coin_credit(uuid, bigint, text, text, text, uuid, text, jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.yike_coin_debit(uuid, bigint, text, text, text, text, jsonb) FROM authenticated;

CREATE TABLE IF NOT EXISTS public.yike_coin_purchase_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_code TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  debit_ledger_id UUID REFERENCES public.yike_coin_ledger(id) ON DELETE SET NULL,
  reversal_ledger_id UUID REFERENCES public.yike_coin_ledger(id) ON DELETE SET NULL,
  entity_type TEXT,
  entity_id UUID,
  status TEXT NOT NULL DEFAULT 'debited'
    CHECK (status IN ('debited', 'fulfilled', 'reversed', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT yike_coin_purchase_idempotency_unique UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS yike_coin_purchase_user_idx
  ON public.yike_coin_purchase_entitlements (user_id, created_at DESC);

ALTER TABLE public.yike_coin_purchase_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY yike_coin_purchase_self_read ON public.yike_coin_purchase_entitlements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY yike_coin_purchase_staff ON public.yike_coin_purchase_entitlements
  FOR ALL USING (is_staff_admin());

-- Session-scoped free allowance (release on failed / unanswered connected calls)
CREATE TABLE IF NOT EXISTS public.video_call_free_allowance_claims (
  session_id UUID PRIMARY KEY REFERENCES public.video_call_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  counted BOOLEAN NOT NULL DEFAULT false,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS video_call_free_allowance_claims_user_date_idx
  ON public.video_call_free_allowance_claims (user_id, usage_date);

ALTER TABLE public.video_call_free_allowance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY video_call_free_allowance_claims_self_read ON public.video_call_free_allowance_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY video_call_free_allowance_claims_staff ON public.video_call_free_allowance_claims
  FOR ALL USING (is_staff_admin());

-- Idempotent compensating credit for a prior debit (refund / delivery failure)
CREATE OR REPLACE FUNCTION public.yike_coin_reverse_debit(
  p_user_id uuid,
  p_original_idempotency_key text,
  p_reversal_idempotency_key text,
  p_reason text DEFAULT NULL
)
RETURNS TABLE (ledger_id uuid, balance_after bigint, already_applied boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_debit public.yike_coin_ledger%ROWTYPE;
  v_reversal public.yike_coin_ledger%ROWTYPE;
  v_after bigint;
  v_reverses_debit uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_user_id';
  END IF;
  IF p_original_idempotency_key IS NULL OR btrim(p_original_idempotency_key) = '' THEN
    RAISE EXCEPTION 'invalid_original_idempotency_key';
  END IF;
  IF p_reversal_idempotency_key IS NULL OR btrim(p_reversal_idempotency_key) = '' THEN
    RAISE EXCEPTION 'invalid_reversal_key';
  END IF;

  SELECT * INTO v_reversal FROM public.yike_coin_ledger WHERE idempotency_key = p_reversal_idempotency_key;
  IF v_reversal.id IS NOT NULL THEN
    IF v_reversal.user_id <> p_user_id OR v_reversal.direction <> 'credit' THEN
      RAISE EXCEPTION 'idempotency_key_mismatch';
    END IF;
    v_reverses_debit := NULLIF(v_reversal.metadata->>'reverses_ledger_id', '')::uuid;
    SELECT * INTO v_debit FROM public.yike_coin_ledger
    WHERE idempotency_key = p_original_idempotency_key
      AND user_id = p_user_id
      AND direction = 'debit'
    LIMIT 1;
    IF v_debit.id IS NULL
       OR v_reverses_debit IS NULL
       OR v_reverses_debit <> v_debit.id
       OR v_reversal.amount_coins <> v_debit.amount_coins THEN
      RAISE EXCEPTION 'idempotency_key_mismatch';
    END IF;
    SELECT balance_coins INTO v_after FROM public.yike_coin_accounts WHERE user_id = p_user_id;
    RETURN QUERY SELECT v_reversal.id, v_after, true;
    RETURN;
  END IF;

  SELECT * INTO v_debit FROM public.yike_coin_ledger
  WHERE idempotency_key = p_original_idempotency_key AND user_id = p_user_id AND direction = 'debit'
  LIMIT 1;

  IF v_debit.id IS NULL OR v_debit.status <> 'completed' THEN
    RAISE EXCEPTION 'debit_not_found';
  END IF;

  RETURN QUERY
  SELECT * FROM public.yike_coin_credit(
    p_user_id,
    v_debit.amount_coins,
    'REV-' || v_debit.reference,
    p_reversal_idempotency_key,
    v_debit.service_code,
    NULL,
    COALESCE(p_reason, 'Purchase reversal'),
    jsonb_build_object('reverses_ledger_id', v_debit.id, 'reverses_idempotency_key', p_original_idempotency_key)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.yike_coin_reverse_debit(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_coin_reverse_debit(uuid, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.yike_coin_reverse_debit(uuid, text, text, text) TO service_role;

DROP FUNCTION IF EXISTS public.yike_video_try_consume_free_allowance(uuid, date, int);

-- Atomically consume one free video slot for a connected session (Africa/Lagos day)
CREATE OR REPLACE FUNCTION public.yike_video_try_consume_free_allowance(
  p_user_id uuid,
  p_session_id uuid,
  p_usage_date date,
  p_free_limit int DEFAULT 3
)
RETURNS TABLE (consumed boolean, count_after int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_claim public.video_call_free_allowance_claims%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_session_id IS NULL THEN
    RAISE EXCEPTION 'invalid_video_allowance_args';
  END IF;

  INSERT INTO public.video_call_daily_usage (user_id, usage_date, free_connected_count)
  VALUES (p_user_id, p_usage_date, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  INSERT INTO public.video_call_free_allowance_claims (session_id, user_id, usage_date, counted)
  VALUES (p_session_id, p_user_id, p_usage_date, false)
  ON CONFLICT (session_id) DO NOTHING;

  SELECT * INTO v_claim FROM public.video_call_free_allowance_claims WHERE session_id = p_session_id FOR UPDATE;
  IF v_claim.session_id IS NULL THEN
    RAISE EXCEPTION 'claim_missing';
  END IF;
  IF v_claim.user_id <> p_user_id THEN
    RAISE EXCEPTION 'session_user_mismatch';
  END IF;

  IF v_claim.counted AND v_claim.released_at IS NULL THEN
    SELECT free_connected_count INTO v_count
    FROM public.video_call_daily_usage
    WHERE user_id = p_user_id AND usage_date = p_usage_date;
    RETURN QUERY SELECT true, COALESCE(v_count, 0);
    RETURN;
  END IF;

  IF v_claim.released_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  SELECT free_connected_count INTO v_count
  FROM public.video_call_daily_usage
  WHERE user_id = p_user_id AND usage_date = p_usage_date
  FOR UPDATE;

  IF v_count >= p_free_limit THEN
    RETURN QUERY SELECT false, v_count;
    RETURN;
  END IF;

  UPDATE public.video_call_daily_usage
  SET free_connected_count = free_connected_count + 1
  WHERE user_id = p_user_id AND usage_date = p_usage_date
  RETURNING free_connected_count INTO v_count;

  UPDATE public.video_call_free_allowance_claims
  SET counted = true
  WHERE session_id = p_session_id AND counted = false;

  RETURN QUERY SELECT true, v_count;
END;
$$;

-- Release a session free slot (idempotent; only if claim exists and was not released)
CREATE OR REPLACE FUNCTION public.yike_video_release_free_allowance(p_session_id uuid)
RETURNS TABLE (released boolean, count_after int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim public.video_call_free_allowance_claims%ROWTYPE;
  v_count int;
BEGIN
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'invalid_session_id';
  END IF;

  SELECT * INTO v_claim FROM public.video_call_free_allowance_claims WHERE session_id = p_session_id FOR UPDATE;
  IF v_claim.session_id IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  IF v_claim.released_at IS NOT NULL THEN
    SELECT free_connected_count INTO v_count
    FROM public.video_call_daily_usage
    WHERE user_id = v_claim.user_id AND usage_date = v_claim.usage_date;
    RETURN QUERY SELECT true, COALESCE(v_count, 0);
    RETURN;
  END IF;

  IF NOT v_claim.counted THEN
    UPDATE public.video_call_free_allowance_claims
    SET released_at = NOW()
    WHERE session_id = p_session_id;
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  UPDATE public.video_call_free_allowance_claims
  SET released_at = NOW()
  WHERE session_id = p_session_id;

  SELECT free_connected_count INTO v_count
  FROM public.video_call_daily_usage
  WHERE user_id = v_claim.user_id AND usage_date = v_claim.usage_date
  FOR UPDATE;

  UPDATE public.video_call_daily_usage
  SET free_connected_count = GREATEST(0, free_connected_count - 1)
  WHERE user_id = v_claim.user_id AND usage_date = v_claim.usage_date
  RETURNING free_connected_count INTO v_count;

  RETURN QUERY SELECT true, v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.yike_video_try_consume_free_allowance(uuid, uuid, date, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_video_try_consume_free_allowance(uuid, uuid, date, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.yike_video_try_consume_free_allowance(uuid, uuid, date, int) TO service_role;

REVOKE ALL ON FUNCTION public.yike_video_release_free_allowance(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_video_release_free_allowance(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.yike_video_release_free_allowance(uuid) TO service_role;

COMMENT ON FUNCTION public.yike_coin_reverse_debit IS 'Idempotent compensating credit linked to an original debit idempotency key.';
COMMENT ON TABLE public.yike_coin_purchase_entitlements IS 'Tracks debit → fulfillment → reversal for Yike Coins purchases.';
