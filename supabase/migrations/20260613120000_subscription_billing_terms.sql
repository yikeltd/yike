-- Admin-editable subscription billing periods and discounts (no deploy to change)

CREATE TABLE IF NOT EXISTS public.subscription_billing_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  months INT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  short_label TEXT NOT NULL,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT subscription_billing_terms_months_check CHECK (months >= 1 AND months <= 36),
  CONSTRAINT subscription_billing_terms_discount_check CHECK (
    discount_percent >= 0 AND discount_percent <= 100
  )
);

CREATE INDEX IF NOT EXISTS subscription_billing_terms_sort_idx
  ON public.subscription_billing_terms (active, sort_order, months);

INSERT INTO public.subscription_billing_terms (months, label, short_label, discount_percent, sort_order)
VALUES
  (1, '1 month', 'Monthly', 0, 10),
  (3, '3 months', '3 mo', 10, 20),
  (6, '6 months', '6 mo', 20, 30),
  (12, '12 months', '12 mo', 30, 40)
ON CONFLICT (months) DO UPDATE SET
  label = EXCLUDED.label,
  short_label = EXCLUDED.short_label,
  discount_percent = EXCLUDED.discount_percent,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

ALTER TABLE public.subscription_billing_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_billing_terms_staff
  ON public.subscription_billing_terms
  FOR ALL
  TO authenticated
  USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

CREATE POLICY subscription_billing_terms_public_read
  ON public.subscription_billing_terms
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

COMMENT ON TABLE public.subscription_billing_terms IS
  'Admin-editable billing periods and upfront discounts for subscription checkout.';
