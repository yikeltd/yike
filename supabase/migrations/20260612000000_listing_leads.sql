-- Phase 8: Seller listing leads (real interactions, not sold lead marketplace)

CREATE TABLE IF NOT EXISTS public.listing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  lead_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  lead_source TEXT,
  quality_score INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legacy_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT listing_leads_type_check
    CHECK (lead_type IN ('whatsapp', 'call', 'save', 'follow', 'message', 'verification_request')),
  CONSTRAINT listing_leads_status_check
    CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'lost'))
);

CREATE INDEX IF NOT EXISTS listing_leads_seller_status_idx
  ON public.listing_leads (seller_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_leads_listing_idx
  ON public.listing_leads (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_leads_created_idx
  ON public.listing_leads (created_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lead_insights_until TIMESTAMPTZ;

COMMENT ON TABLE public.listing_leads IS
  'Real seller leads from taps/saves/follows — not recycled lead sales.';
COMMENT ON COLUMN public.listing_leads.quality_score IS
  'Internal ranking only — not shown to buyers.';

-- Lead insights included in Pro+ plans
UPDATE public.subscription_plans
SET features = features || '{"lead_insights":true}'::jsonb,
    updated_at = now()
WHERE plan_code IN ('pro_agent', 'agency', 'developer');

INSERT INTO public.subscription_plans (name, plan_code, monthly_price, active_listing_limit, features, status)
VALUES (
  'Lead Insights',
  'lead_insights',
  4999,
  NULL,
  '{"lead_insights":true,"analytics":"advanced","lead_export":true}'::jsonb,
  'active'
)
ON CONFLICT (plan_code) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  features = EXCLUDED.features,
  updated_at = now();

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
    'subscription',
    'lead_insights'
  ));

ALTER TABLE public.listing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY listing_leads_seller_read
  ON public.listing_leads
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY listing_leads_seller_update
  ON public.listing_leads
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());
