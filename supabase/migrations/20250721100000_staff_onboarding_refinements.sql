-- Staff onboarding lifecycle refinements

-- Expand status lifecycle (migrate legacy disabled → suspended)
UPDATE public.staff_profiles SET status = 'suspended' WHERE status = 'disabled';

ALTER TABLE public.staff_profiles DROP CONSTRAINT IF EXISTS staff_profiles_status_check;

ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS access_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS require_password_reset boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_reset_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS hr_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.staff_profiles
  ADD CONSTRAINT staff_profiles_status_check CHECK (
    status IN (
      'onboarding_pending',
      'invited',
      'onboarding_sent',
      'first_login_pending',
      'active',
      'suspended',
      'archived'
    )
  );

CREATE TABLE IF NOT EXISTS public.staff_onboarding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff_profiles (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_onboarding_events_staff_idx
  ON public.staff_onboarding_events (staff_id, created_at DESC);

ALTER TABLE public.staff_onboarding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read staff onboarding events"
  ON public.staff_onboarding_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin write staff onboarding events"
  ON public.staff_onboarding_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );
