-- Staff onboarding metadata (Zoho work email + onboarding tracking)

ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS work_email TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_note TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_instructions TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarded_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.job_applications (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_role_label TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS staff_profiles_work_email_unique_idx
  ON public.staff_profiles (lower(trim(work_email)))
  WHERE work_email IS NOT NULL AND trim(work_email) <> '';

CREATE INDEX IF NOT EXISTS staff_profiles_application_id_idx
  ON public.staff_profiles (application_id)
  WHERE application_id IS NOT NULL;
