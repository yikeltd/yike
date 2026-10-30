-- Yike Coins (platform credits), marketplace messaging, video call metering
-- Integer coin balances only. 1 coin nominal = ₦1 approved service pricing.

CREATE TABLE IF NOT EXISTS public.yike_coin_accounts (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance_coins BIGINT NOT NULL DEFAULT 0 CHECK (balance_coins >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.yike_coin_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  amount_coins BIGINT NOT NULL CHECK (amount_coins > 0),
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'reversed', 'refunded')),
  reference TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  service_code TEXT,
  payment_order_id UUID REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  balance_after BIGINT,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT yike_coin_ledger_reference_unique UNIQUE (reference),
  CONSTRAINT yike_coin_ledger_idempotency_unique UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS yike_coin_ledger_user_created_idx
  ON public.yike_coin_ledger (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.platform_service_pricing (
  service_code TEXT PRIMARY KEY,
  price_coins BIGINT,
  label TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.platform_service_pricing (service_code, price_coins, label, description, active)
VALUES
  ('video_call_connected', NULL, 'Additional connected video call', 'Billable after daily free allowance', false),
  ('listing_boost', NULL, 'Listing boost', 'Uses boost plan pricing via purchase engine', false)
ON CONFLICT (service_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.marketplace_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('PROPERTY', 'VEHICLE', 'ELECTRONICS')),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT marketplace_conversations_unique UNIQUE (listing_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS marketplace_conversations_buyer_idx
  ON public.marketplace_conversations (buyer_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS marketplace_conversations_seller_idx
  ON public.marketplace_conversations (seller_id, last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.marketplace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.marketplace_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0 AND char_length(body) <= 4000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS marketplace_messages_conversation_idx
  ON public.marketplace_messages (conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS public.video_call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.marketplace_conversations(id) ON DELETE SET NULL,
  listing_id UUID,
  caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
  status TEXT NOT NULL DEFAULT 'ringing'
    CHECK (status IN ('ringing', 'connected', 'ended', 'declined', 'failed', 'missed', 'cancelled')),
  provider TEXT,
  provider_session_id TEXT,
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  billing_status TEXT NOT NULL DEFAULT 'none'
    CHECK (billing_status IN ('none', 'free_allowance', 'coin_debit', 'waived', 'failed')),
  coin_ledger_id UUID REFERENCES public.yike_coin_ledger(id) ON DELETE SET NULL,
  idempotency_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS video_call_sessions_idempotency_idx
  ON public.video_call_sessions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.video_call_daily_usage (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  free_connected_count INT NOT NULL DEFAULT 0 CHECK (free_connected_count >= 0),
  PRIMARY KEY (user_id, usage_date)
);

-- ── Helpers ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.yike_ensure_coin_account(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.yike_coin_accounts (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT user_id INTO v_id FROM public.yike_coin_accounts WHERE user_id = p_user_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.yike_coin_credit(
  p_user_id uuid,
  p_amount_coins bigint,
  p_reference text,
  p_idempotency_key text,
  p_service_code text DEFAULT NULL,
  p_payment_order_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (ledger_id uuid, balance_after bigint, already_applied boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.yike_coin_ledger%ROWTYPE;
  v_before bigint;
  v_after bigint;
  v_ledger uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_user_id';
  END IF;
  IF p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;
  IF p_reference IS NULL OR btrim(p_reference) = '' THEN
    RAISE EXCEPTION 'invalid_reference';
  END IF;
  IF p_amount_coins IS NULL OR p_amount_coins <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT * INTO v_existing FROM public.yike_coin_ledger WHERE idempotency_key = p_idempotency_key;
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.user_id <> p_user_id
       OR v_existing.direction <> 'credit'
       OR v_existing.amount_coins <> p_amount_coins
       OR v_existing.reference <> p_reference THEN
      RAISE EXCEPTION 'idempotency_key_mismatch';
    END IF;
    SELECT balance_coins INTO v_after FROM public.yike_coin_accounts WHERE user_id = p_user_id;
    RETURN QUERY SELECT v_existing.id, v_after, true;
    RETURN;
  END IF;

  PERFORM public.yike_ensure_coin_account(p_user_id);

  SELECT balance_coins INTO v_before
  FROM public.yike_coin_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_after := v_before + p_amount_coins;

  UPDATE public.yike_coin_accounts
  SET balance_coins = v_after, updated_at = NOW()
  WHERE user_id = p_user_id;

  BEGIN
    INSERT INTO public.yike_coin_ledger (
      user_id, direction, amount_coins, status, reference, idempotency_key,
      service_code, payment_order_id, balance_after, reason, metadata, completed_at
    )
    VALUES (
      p_user_id, 'credit', p_amount_coins, 'completed', p_reference, p_idempotency_key,
      p_service_code, p_payment_order_id, v_after, p_reason, p_metadata, NOW()
    )
    RETURNING id INTO v_ledger;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT * INTO v_existing FROM public.yike_coin_ledger WHERE idempotency_key = p_idempotency_key;
      IF v_existing.id IS NULL
         OR v_existing.user_id <> p_user_id
         OR v_existing.direction <> 'credit'
         OR v_existing.amount_coins <> p_amount_coins
         OR v_existing.reference <> p_reference THEN
        RAISE EXCEPTION 'idempotency_key_mismatch';
      END IF;
      SELECT balance_coins INTO v_after FROM public.yike_coin_accounts WHERE user_id = p_user_id;
      RETURN QUERY SELECT v_existing.id, v_after, true;
      RETURN;
  END;

  RETURN QUERY SELECT v_ledger, v_after, false;
END;
$$;

CREATE OR REPLACE FUNCTION public.yike_coin_debit(
  p_user_id uuid,
  p_amount_coins bigint,
  p_reference text,
  p_idempotency_key text,
  p_service_code text DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (ledger_id uuid, balance_after bigint, already_applied boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.yike_coin_ledger%ROWTYPE;
  v_before bigint;
  v_after bigint;
  v_ledger uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_user_id';
  END IF;
  IF p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;
  IF p_reference IS NULL OR btrim(p_reference) = '' THEN
    RAISE EXCEPTION 'invalid_reference';
  END IF;
  IF p_amount_coins IS NULL OR p_amount_coins <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT * INTO v_existing FROM public.yike_coin_ledger WHERE idempotency_key = p_idempotency_key;
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.user_id <> p_user_id
       OR v_existing.direction <> 'debit'
       OR v_existing.amount_coins <> p_amount_coins
       OR v_existing.reference <> p_reference THEN
      RAISE EXCEPTION 'idempotency_key_mismatch';
    END IF;
    SELECT balance_coins INTO v_after FROM public.yike_coin_accounts WHERE user_id = p_user_id;
    RETURN QUERY SELECT v_existing.id, v_after, true;
    RETURN;
  END IF;

  PERFORM public.yike_ensure_coin_account(p_user_id);

  SELECT balance_coins INTO v_before
  FROM public.yike_coin_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_before < p_amount_coins THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  v_after := v_before - p_amount_coins;

  UPDATE public.yike_coin_accounts
  SET balance_coins = v_after, updated_at = NOW()
  WHERE user_id = p_user_id;

  BEGIN
    INSERT INTO public.yike_coin_ledger (
      user_id, direction, amount_coins, status, reference, idempotency_key,
      service_code, balance_after, reason, metadata, completed_at
    )
    VALUES (
      p_user_id, 'debit', p_amount_coins, 'completed', p_reference, p_idempotency_key,
      p_service_code, v_after, p_reason, p_metadata, NOW()
    )
    RETURNING id INTO v_ledger;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT * INTO v_existing FROM public.yike_coin_ledger WHERE idempotency_key = p_idempotency_key;
      IF v_existing.id IS NULL
         OR v_existing.user_id <> p_user_id
         OR v_existing.direction <> 'debit'
         OR v_existing.amount_coins <> p_amount_coins
         OR v_existing.reference <> p_reference THEN
        RAISE EXCEPTION 'idempotency_key_mismatch';
      END IF;
      SELECT balance_coins INTO v_after FROM public.yike_coin_accounts WHERE user_id = p_user_id;
      RETURN QUERY SELECT v_existing.id, v_after, true;
      RETURN;
  END;

  RETURN QUERY SELECT v_ledger, v_after, false;
END;
$$;

REVOKE ALL ON FUNCTION public.yike_ensure_coin_account(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_coin_credit(uuid, bigint, text, text, text, uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_coin_debit(uuid, bigint, text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_ensure_coin_account(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.yike_coin_credit(uuid, bigint, text, text, text, uuid, text, jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.yike_coin_debit(uuid, bigint, text, text, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.yike_ensure_coin_account(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_coin_credit(uuid, bigint, text, text, text, uuid, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_coin_debit(uuid, bigint, text, text, text, text, jsonb) TO service_role;

ALTER TABLE public.yike_coin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yike_coin_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_call_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_service_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY yike_coin_accounts_self_read ON public.yike_coin_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY yike_coin_ledger_self_read ON public.yike_coin_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY marketplace_conversations_member ON public.marketplace_conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY marketplace_messages_member_read ON public.marketplace_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY video_call_sessions_participant_read ON public.video_call_sessions
  FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY video_call_daily_usage_self_read ON public.video_call_daily_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY platform_service_pricing_public_read ON public.platform_service_pricing
  FOR SELECT USING (true);

CREATE POLICY yike_coin_accounts_staff ON public.yike_coin_accounts
  FOR ALL USING (is_staff_admin());
CREATE POLICY yike_coin_ledger_staff ON public.yike_coin_ledger
  FOR ALL USING (is_staff_admin());
CREATE POLICY marketplace_conversations_staff ON public.marketplace_conversations
  FOR ALL USING (is_staff_admin());
CREATE POLICY marketplace_messages_staff ON public.marketplace_messages
  FOR ALL USING (is_staff_admin());
CREATE POLICY video_call_sessions_staff ON public.video_call_sessions
  FOR ALL USING (is_staff_admin());
CREATE POLICY platform_service_pricing_staff ON public.platform_service_pricing
  FOR ALL USING (is_staff_admin());

COMMENT ON TABLE public.yike_coin_accounts IS 'Authoritative Yike Coins balance per user (integer coins).';
COMMENT ON TABLE public.yike_coin_ledger IS 'Immutable Yike Coins ledger; credits/debits only via RPC.';
