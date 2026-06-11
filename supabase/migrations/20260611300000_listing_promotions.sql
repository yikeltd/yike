-- Featured listing promotions (payment-ready foundation)

CREATE TABLE IF NOT EXISTS public.listing_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promotion_type TEXT NOT NULL DEFAULT 'featured',
  duration_days INTEGER NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  promotion_reference TEXT NOT NULL,
  payment_reference TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT listing_promotions_type_check
    CHECK (promotion_type IN ('featured')),
  CONSTRAINT listing_promotions_status_check
    CHECK (status IN ('pending', 'paid', 'active', 'expired', 'cancelled', 'failed')),
  CONSTRAINT listing_promotions_duration_check
    CHECK (duration_days IN (7, 30))
);

CREATE UNIQUE INDEX IF NOT EXISTS listing_promotions_reference_unique
  ON public.listing_promotions (promotion_reference);

CREATE INDEX IF NOT EXISTS listing_promotions_listing_idx
  ON public.listing_promotions (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_promotions_user_idx
  ON public.listing_promotions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_promotions_status_idx
  ON public.listing_promotions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_promotions_type_idx
  ON public.listing_promotions (promotion_type, status);

CREATE INDEX IF NOT EXISTS listing_promotions_expires_idx
  ON public.listing_promotions (expires_at)
  WHERE status = 'active';

-- Quick counters for featured reporting
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS featured_impressions INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured_clicks INT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.set_listing_promotions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listing_promotions_updated_at ON public.listing_promotions;
CREATE TRIGGER listing_promotions_updated_at
  BEFORE UPDATE ON public.listing_promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_listing_promotions_updated_at();

ALTER TABLE public.listing_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY listing_promotions_select_own ON public.listing_promotions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_admin());

CREATE POLICY listing_promotions_insert_own ON public.listing_promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY listing_promotions_staff ON public.listing_promotions
  FOR ALL
  TO authenticated
  USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

NOTIFY pgrst, 'reload schema';
