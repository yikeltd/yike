-- Financial Platform: immutable append-only ledger (source of truth).
-- Entries are never updated or deleted. Service role writes; staff read.

CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type TEXT NOT NULL
    CHECK (entry_type IN (
      'payment',
      'refund',
      'commission',
      'wallet_credit',
      'wallet_debit',
      'settlement',
      'promotion_credit',
      'subscription',
      'adjustment',
      'reserve',
      'release'
    )),
  account_id TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  reference TEXT NOT NULL,
  correlation_id UUID NOT NULL,
  capability TEXT NOT NULL DEFAULT 'financial.platform',
  provider TEXT,
  payment_order_id UUID REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.financial_ledger_entries IS
  'Immutable Financial Platform ledger. Append-only — never UPDATE or DELETE rows.';

CREATE INDEX IF NOT EXISTS financial_ledger_account_created_idx
  ON public.financial_ledger_entries (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS financial_ledger_reference_idx
  ON public.financial_ledger_entries (reference);

CREATE INDEX IF NOT EXISTS financial_ledger_correlation_idx
  ON public.financial_ledger_entries (correlation_id);

CREATE INDEX IF NOT EXISTS financial_ledger_type_created_idx
  ON public.financial_ledger_entries (entry_type, created_at DESC);

CREATE INDEX IF NOT EXISTS financial_ledger_payment_order_idx
  ON public.financial_ledger_entries (payment_order_id)
  WHERE payment_order_id IS NOT NULL;

-- Idempotency: one row per (reference, direction, entry_type, account_id)
ALTER TABLE public.financial_ledger_entries
  ADD CONSTRAINT financial_ledger_idempotent_uq
  UNIQUE (reference, direction, entry_type, account_id);

ALTER TABLE public.financial_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_ledger_staff_select
  ON public.financial_ledger_entries
  FOR SELECT
  USING (is_staff_admin());

-- No UPDATE/DELETE policies for authenticated — immutability.
-- Writes go through service_role only.

REVOKE INSERT, UPDATE, DELETE ON public.financial_ledger_entries FROM anon, authenticated;
GRANT SELECT ON public.financial_ledger_entries TO authenticated;
GRANT ALL ON public.financial_ledger_entries TO service_role;

-- Block mutations via trigger (defense in depth even for service_role mistakes)
CREATE OR REPLACE FUNCTION public.financial_ledger_reject_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'financial_ledger_entries is append-only; % not allowed', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS financial_ledger_no_update ON public.financial_ledger_entries;
CREATE TRIGGER financial_ledger_no_update
  BEFORE UPDATE ON public.financial_ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.financial_ledger_reject_mutation();

DROP TRIGGER IF EXISTS financial_ledger_no_delete ON public.financial_ledger_entries;
CREATE TRIGGER financial_ledger_no_delete
  BEFORE DELETE ON public.financial_ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.financial_ledger_reject_mutation();
