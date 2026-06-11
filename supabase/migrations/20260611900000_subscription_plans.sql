-- Phase 7: Agency & developer subscription plans

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_code TEXT NOT NULL UNIQUE,
  monthly_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  active_listing_limit INT,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT subscription_plans_status_check
    CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  payment_reference TEXT,
  payment_order_id UUID REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  founding_price_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_subscriptions_status_check
    CHECK (status IN ('active', 'expired', 'cancelled', 'pending'))
);

CREATE INDEX IF NOT EXISTS user_subscriptions_user_status_idx
  ON public.user_subscriptions (user_id, status, expires_at DESC);

CREATE INDEX IF NOT EXISTS user_subscriptions_expires_idx
  ON public.user_subscriptions (status, expires_at)
  WHERE status = 'active';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_plan_code TEXT,
  ADD COLUMN IF NOT EXISTS founding_member BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.subscription_plan_code IS
  'Cached active plan_code from user_subscriptions (free when null).';
COMMENT ON COLUMN public.profiles.founding_member IS
  'Launch pricing locked for early subscribers.';

INSERT INTO public.subscription_plans (name, plan_code, monthly_price, active_listing_limit, features, status)
VALUES
  (
    'Free',
    'free',
    0,
    5,
    '{"analytics":"basic","verification":"basic","featured_discount":0,"boost_discount":0}'::jsonb,
    'active'
  ),
  (
    'Pro Agent',
    'pro_agent',
    9999,
    30,
    '{"analytics":"advanced","verification":"business_included","featured_discount":0.1,"boost_discount":0.1,"priority_review":true}'::jsonb,
    'active'
  ),
  (
    'Agency',
    'agency',
    24999,
    100,
    '{"analytics":"advanced","verification":"business_included","featured_discount":0.15,"boost_discount":0.15,"agency_profile":true,"team_support":true,"priority_support":true}'::jsonb,
    'active'
  ),
  (
    'Developer',
    'developer',
    49999,
    NULL,
    '{"analytics":"advanced","verification":"business_included","featured_discount":0.2,"boost_discount":0.2,"developer_profile":true,"project_showcase":true,"homepage_eligible":true,"priority_support":true}'::jsonb,
    'active'
  )
ON CONFLICT (plan_code) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  active_listing_limit = EXCLUDED.active_listing_limit,
  features = EXCLUDED.features,
  status = EXCLUDED.status,
  updated_at = now();

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_plans_public_read
  ON public.subscription_plans
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY user_subscriptions_own_read
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Listing limit: subscription-synced profile.listing_limit (no verified unlimited bypass)
CREATE OR REPLACE FUNCTION check_agent_listing_limit()
RETURNS TRIGGER AS $$
DECLARE
  prof RECORD;
  active_count INT;
  cap INT;
  acct TEXT;
  becoming_active BOOLEAN;
  was_active BOOLEAN;
BEGIN
  becoming_active :=
    NEW.status IN ('pending', 'approved')
    AND NEW.expires_at > NOW();

  IF TG_OP = 'UPDATE' THEN
    was_active :=
      OLD.status IN ('pending', 'approved')
      AND OLD.expires_at > NOW();
    IF NOT becoming_active OR was_active THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT
    role, listing_limit, subscription_plan_code, profile_status, account_status,
    verification_required, is_banned
  INTO prof
  FROM profiles
  WHERE id = NEW.agent_id;

  IF prof IS NULL THEN
    RAISE EXCEPTION 'Agent profile not found';
  END IF;

  IF prof.is_banned THEN
    RAISE EXCEPTION 'Account restricted. Contact Yike support.';
  END IF;

  acct := COALESCE(prof.account_status, prof.profile_status::text, 'active');

  IF acct IN ('suspended', 'deleted') THEN
    RAISE EXCEPTION 'Account restricted. Contact Yike support.';
  END IF;

  IF acct IN ('on_hold', 'pending_verification')
     OR (prof.verification_required AND acct <> 'active') THEN
    RAISE EXCEPTION 'Your account is under review. Contact Yike to verify or restore posting.';
  END IF;

  IF prof.role IN ('admin', 'super_admin') THEN
    RETURN NEW;
  END IF;

  IF prof.role NOT IN ('agent_unverified', 'agent_verified', 'agent') THEN
    RAISE EXCEPTION 'Only agents can create listings';
  END IF;

  IF prof.subscription_plan_code = 'developer' THEN
    RETURN NEW;
  END IF;

  IF prof.listing_limit IS NOT NULL THEN
    cap := prof.listing_limit;
  ELSE
    cap := 5;
  END IF;

  SELECT COUNT(*)::INT INTO active_count
  FROM properties
  WHERE agent_id = NEW.agent_id
    AND status IN ('pending', 'approved')
    AND expires_at > NOW()
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF active_count >= cap THEN
    RAISE EXCEPTION 'Listing limit reached (%). Upgrade your plan at yike.ng/pricing.', cap;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.subscription_plans IS
  'Seller subscription tiers — free listings remain; paid plans unlock scale.';
COMMENT ON TABLE public.user_subscriptions IS
  'Manual renewal only — no auto-charge.';
