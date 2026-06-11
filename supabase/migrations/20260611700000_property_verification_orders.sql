-- Phase 5: Property verification service packages (paid orders)

CREATE TABLE IF NOT EXISTS public.property_verification_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.property_verification_requests(id) ON DELETE SET NULL,
  package_type TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  verification_reference TEXT UNIQUE,
  request_notes TEXT,
  report_url TEXT,
  report_summary TEXT,
  report_media JSONB NOT NULL DEFAULT '{}'::jsonb,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_order_id UUID REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT property_verification_orders_package_check
    CHECK (package_type IN ('basic', 'standard', 'premium')),
  CONSTRAINT property_verification_orders_status_check
    CHECK (status IN (
      'pending', 'paid', 'assigned', 'in_progress', 'completed', 'cancelled', 'refunded'
    ))
);

CREATE INDEX IF NOT EXISTS property_verification_orders_user_idx
  ON public.property_verification_orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS property_verification_orders_status_idx
  ON public.property_verification_orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS property_verification_orders_property_idx
  ON public.property_verification_orders (property_id)
  WHERE property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS property_verification_orders_request_idx
  ON public.property_verification_orders (request_id);

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS physically_verified_at TIMESTAMPTZ;

ALTER TABLE public.property_verification_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY property_verification_orders_select_own
  ON public.property_verification_orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.property_verification_orders IS
  'Paid property verification packages — independent physical inspection, not title verification.';
