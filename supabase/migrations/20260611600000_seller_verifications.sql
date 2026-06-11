-- Phase 4: Seller verification badges (basic free · business paid review)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seller_verification_level TEXT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_seller_verification_level_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_seller_verification_level_check
  CHECK (seller_verification_level IS NULL OR seller_verification_level IN ('basic', 'business'));

CREATE TABLE IF NOT EXISTS public.seller_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_level TEXT NOT NULL DEFAULT 'business',
  status TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  documents JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_order_id UUID REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seller_verifications_level_check
    CHECK (verification_level IN ('basic', 'business')),
  CONSTRAINT seller_verifications_status_check
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS seller_verifications_user_id_idx
  ON public.seller_verifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS seller_verifications_status_idx
  ON public.seller_verifications (status, submitted_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS seller_verifications_one_active_business_idx
  ON public.seller_verifications (user_id)
  WHERE verification_level = 'business'
    AND status IN ('pending', 'under_review', 'approved');

ALTER TABLE public.payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_order_type_check;

ALTER TABLE public.payment_orders
  ADD CONSTRAINT payment_orders_order_type_check
  CHECK (order_type IN (
    'featured_listing',
    'boost_listing',
    'property_verification',
    'verification_fee',
    'subscription'
  ));

ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY seller_verifications_select_own
  ON public.seller_verifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY seller_verifications_insert_own
  ON public.seller_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY seller_verifications_update_own
  ON public.seller_verifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.seller_verifications IS
  'Paid business verification review queue. Basic (free) level is derived on profiles.seller_verification_level.';
