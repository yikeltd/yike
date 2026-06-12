-- Track when a lister started on the Starter (free) plan for progressive listing caps.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS starter_plan_started_at TIMESTAMPTZ;

UPDATE public.profiles
SET starter_plan_started_at = created_at
WHERE starter_plan_started_at IS NULL
  AND role IN ('agent', 'agent_unverified', 'agent_verified')
  AND (subscription_plan_code IS NULL OR subscription_plan_code = 'free');

COMMENT ON COLUMN public.profiles.starter_plan_started_at IS
  'When the lister began on Starter (free) — used for month-based listing capacity.';
