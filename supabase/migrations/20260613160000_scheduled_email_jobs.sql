-- Delayed transactional emails (e.g. founder welcome 6h after signup).

CREATE TABLE IF NOT EXISTS public.scheduled_email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  template_key TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scheduled_email_jobs_user_template_unique UNIQUE (user_id, template_key)
);

CREATE INDEX IF NOT EXISTS scheduled_email_jobs_due_idx
  ON public.scheduled_email_jobs (scheduled_for)
  WHERE sent_at IS NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

COMMENT ON TABLE public.scheduled_email_jobs IS
  'Queue for delayed transactional emails processed by cron.';
COMMENT ON COLUMN public.profiles.welcome_email_sent_at IS
  'When the founder welcome email was successfully sent.';

ALTER TABLE public.scheduled_email_jobs ENABLE ROW LEVEL SECURITY;
