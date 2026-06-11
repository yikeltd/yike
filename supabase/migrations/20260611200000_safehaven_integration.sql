-- Safe Haven / Sudo payment infrastructure (preparation mode)

CREATE TABLE IF NOT EXISTS public.safehaven_virtual_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'safehaven',
  provider_reference TEXT,
  account_number TEXT,
  account_name TEXT,
  bank_name TEXT,
  bank_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT safehaven_virtual_accounts_status_check
    CHECK (status IN ('pending', 'active', 'failed', 'closed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS safehaven_virtual_accounts_user_unique
  ON public.safehaven_virtual_accounts (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS safehaven_virtual_accounts_provider_ref_unique
  ON public.safehaven_virtual_accounts (provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS safehaven_virtual_accounts_account_number_unique
  ON public.safehaven_virtual_accounts (account_number)
  WHERE account_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.safehaven_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  virtual_account_id UUID REFERENCES public.safehaven_virtual_accounts(id) ON DELETE SET NULL,
  provider_reference TEXT,
  transaction_reference TEXT,
  type TEXT,
  direction TEXT,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  fee NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending',
  narration TEXT,
  raw_response JSONB,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT safehaven_transactions_status_check
    CHECK (status IN ('pending', 'successful', 'failed', 'reversed', 'disputed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS safehaven_transactions_provider_ref_unique
  ON public.safehaven_transactions (provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS safehaven_transactions_tx_ref_unique
  ON public.safehaven_transactions (transaction_reference)
  WHERE transaction_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS safehaven_transactions_user_idx
  ON public.safehaven_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS safehaven_transactions_va_idx
  ON public.safehaven_transactions (virtual_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS safehaven_transactions_status_idx
  ON public.safehaven_transactions (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.safehaven_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT,
  provider_reference TEXT,
  event_type TEXT,
  payload JSONB NOT NULL,
  headers JSONB,
  status TEXT NOT NULL DEFAULT 'received',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT safehaven_webhook_events_status_check
    CHECK (status IN ('received', 'processed', 'failed', 'duplicate'))
);

CREATE UNIQUE INDEX IF NOT EXISTS safehaven_webhook_events_event_id_unique
  ON public.safehaven_webhook_events (event_id)
  WHERE event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS safehaven_webhook_events_provider_ref_unique
  ON public.safehaven_webhook_events (provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS safehaven_webhook_events_created_idx
  ON public.safehaven_webhook_events (created_at DESC);

CREATE TABLE IF NOT EXISTS public.safehaven_provider_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_reference TEXT,
  request_summary JSONB,
  response_summary JSONB,
  error_code TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS safehaven_provider_logs_action_idx
  ON public.safehaven_provider_logs (action, created_at DESC);

ALTER TABLE public.safehaven_virtual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safehaven_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safehaven_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safehaven_provider_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS safehaven_virtual_accounts_user_select ON public.safehaven_virtual_accounts;
CREATE POLICY safehaven_virtual_accounts_user_select ON public.safehaven_virtual_accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS safehaven_virtual_accounts_staff ON public.safehaven_virtual_accounts;
CREATE POLICY safehaven_virtual_accounts_staff ON public.safehaven_virtual_accounts
  FOR ALL USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

DROP POLICY IF EXISTS safehaven_transactions_user_select ON public.safehaven_transactions;
CREATE POLICY safehaven_transactions_user_select ON public.safehaven_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS safehaven_transactions_staff ON public.safehaven_transactions;
CREATE POLICY safehaven_transactions_staff ON public.safehaven_transactions
  FOR ALL USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

DROP POLICY IF EXISTS safehaven_webhook_events_staff ON public.safehaven_webhook_events;
CREATE POLICY safehaven_webhook_events_staff ON public.safehaven_webhook_events
  FOR SELECT USING (public.is_staff_admin());

DROP POLICY IF EXISTS safehaven_provider_logs_staff ON public.safehaven_provider_logs;
CREATE POLICY safehaven_provider_logs_staff ON public.safehaven_provider_logs
  FOR SELECT USING (public.is_staff_admin());

DROP TRIGGER IF EXISTS safehaven_virtual_accounts_updated_at ON public.safehaven_virtual_accounts;
CREATE TRIGGER safehaven_virtual_accounts_updated_at
  BEFORE UPDATE ON public.safehaven_virtual_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS safehaven_transactions_updated_at ON public.safehaven_transactions;
CREATE TRIGGER safehaven_transactions_updated_at
  BEFORE UPDATE ON public.safehaven_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

NOTIFY pgrst, 'reload schema';
