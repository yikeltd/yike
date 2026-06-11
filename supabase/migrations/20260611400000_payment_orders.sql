-- Payment orders + Paystack webhook deduplication

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL,
  reference TEXT NOT NULL,
  provider TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending',
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_orders_order_type_check
    CHECK (order_type IN ('featured_listing', 'boost_listing', 'property_verification', 'subscription')),
  CONSTRAINT payment_orders_status_check
    CHECK (status IN ('pending', 'processing', 'successful', 'failed', 'cancelled', 'refunded'))
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_reference_unique
  ON public.payment_orders (reference);

CREATE INDEX IF NOT EXISTS payment_orders_status_idx
  ON public.payment_orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_orders_order_type_idx
  ON public.payment_orders (order_type, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_orders_user_idx
  ON public.payment_orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_orders_entity_idx
  ON public.payment_orders (entity_id)
  WHERE entity_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.paystack_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT,
  event_type TEXT,
  reference TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT paystack_webhook_events_status_check
    CHECK (status IN ('received', 'processed', 'failed', 'duplicate'))
);

CREATE UNIQUE INDEX IF NOT EXISTS paystack_webhook_events_event_id_unique
  ON public.paystack_webhook_events (event_id)
  WHERE event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS paystack_webhook_events_reference_unique
  ON public.paystack_webhook_events (reference)
  WHERE reference IS NOT NULL AND status = 'processed';

CREATE INDEX IF NOT EXISTS paystack_webhook_events_created_idx
  ON public.paystack_webhook_events (created_at DESC);

DROP TRIGGER IF EXISTS payment_orders_updated_at ON public.payment_orders;
CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paystack_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_orders_select_own ON public.payment_orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_admin());

CREATE POLICY payment_orders_staff ON public.payment_orders
  FOR ALL
  TO authenticated
  USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

CREATE POLICY paystack_webhook_events_staff ON public.paystack_webhook_events
  FOR SELECT
  TO authenticated
  USING (public.is_staff_admin());

NOTIFY pgrst, 'reload schema';
