-- Phase 6: Paid homepage & search sponsored placements

CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  advertiser_name TEXT NOT NULL,
  advertiser_type TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  destination_url TEXT NOT NULL,
  placement TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  duration_plan TEXT,
  payment_order_id UUID REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT advertisements_placement_check
    CHECK (placement IN ('homepage_top', 'homepage_middle', 'search_results')),
  CONSTRAINT advertisements_status_check
    CHECK (status IN ('draft', 'pending', 'active', 'paused', 'expired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS advertisements_one_active_per_placement_idx
  ON public.advertisements (placement)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS advertisements_status_idx
  ON public.advertisements (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_impressions_ad_idx
  ON public.ad_impressions (advertisement_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_clicks_ad_idx
  ON public.ad_clicks (advertisement_id, created_at DESC);

ALTER TABLE public.payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_order_type_check;

ALTER TABLE public.payment_orders
  ADD CONSTRAINT payment_orders_order_type_check
  CHECK (order_type IN (
    'featured_listing',
    'boost_listing',
    'property_verification',
    'verification_fee',
    'advertisement',
    'subscription'
  ));

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY advertisements_public_active_read
  ON public.advertisements
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

COMMENT ON TABLE public.advertisements IS
  'Paid sponsored placements — max one active per placement. Label: Sponsored.';
