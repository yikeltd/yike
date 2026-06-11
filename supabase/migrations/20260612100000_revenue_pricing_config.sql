-- Admin-controlled revenue pricing (no deploys required to change prices)

CREATE TABLE IF NOT EXISTS public.revenue_pricing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL,
  variant_key TEXT NOT NULL,
  label TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  duration_days INT,
  duration_hours INT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT revenue_pricing_items_product_variant_unique UNIQUE (product, variant_key)
);

CREATE INDEX IF NOT EXISTS revenue_pricing_items_product_idx
  ON public.revenue_pricing_items (product, sort_order);

CREATE TABLE IF NOT EXISTS public.revenue_offers (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  founding_subscription_offer BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT revenue_offers_singleton CHECK (id = true)
);

INSERT INTO public.revenue_offers (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.revenue_pricing_items (product, variant_key, label, amount, duration_days, duration_hours, sort_order)
VALUES
  ('featured_listing', '7d', 'Featured · 7 days', 2999, 7, NULL, 10),
  ('featured_listing', '30d', 'Featured · 30 days', 5999, 30, NULL, 20),
  ('boost_listing', '24h', 'Boost · 24 hours', 999, NULL, 24, 30),
  ('boost_listing', '7d', 'Boost · 7 days', 2499, 7, NULL, 40),
  ('verification_fee', 'standard', 'Business Verified', 4999, NULL, NULL, 50),
  ('property_verification', 'basic', 'Basic verification', 4999, NULL, NULL, 60),
  ('property_verification', 'standard', 'Standard verification', 14999, NULL, NULL, 70),
  ('property_verification', 'premium', 'Premium verification', 29999, NULL, NULL, 80),
  ('lead_insights', 'monthly', 'Lead Insights · monthly', 4999, 30, NULL, 90),
  ('advertisement', 'homepage_top_week', 'Homepage hero · 1 week', 20000, 7, NULL, 100),
  ('advertisement', 'homepage_top_month', 'Homepage hero · 1 month', 60000, 30, NULL, 110),
  ('advertisement', 'homepage_middle_week', 'Homepage mid · 1 week', 15000, 7, NULL, 120),
  ('advertisement', 'homepage_middle_month', 'Homepage mid · 1 month', 40000, 30, NULL, 130),
  ('advertisement', 'search_results_week', 'Search in-feed · 1 week', 10000, 7, NULL, 140),
  ('advertisement', 'search_results_month', 'Search in-feed · 1 month', 30000, 30, NULL, 150)
ON CONFLICT (product, variant_key) DO UPDATE SET
  label = EXCLUDED.label,
  amount = EXCLUDED.amount,
  duration_days = EXCLUDED.duration_days,
  duration_hours = EXCLUDED.duration_hours,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

ALTER TABLE public.revenue_pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY revenue_pricing_items_staff
  ON public.revenue_pricing_items
  FOR ALL
  TO authenticated
  USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

CREATE POLICY revenue_pricing_items_public_read
  ON public.revenue_pricing_items
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY revenue_offers_staff
  ON public.revenue_offers
  FOR ALL
  TO authenticated
  USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

CREATE POLICY revenue_offers_public_read
  ON public.revenue_offers
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON TABLE public.revenue_pricing_items IS
  'Admin-editable prices for all paid products except subscription_plans.monthly_price.';
