-- Repair: 20250717100000 recorded/partially applied but trust_review_cases missing.
-- Every Lex auth layout queries this table for nav badges (super_admin).
-- Project: hlpojfurfldvcxfxhveg

CREATE TABLE IF NOT EXISTS public.trust_review_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_reference TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  case_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  suspicion_score INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  required_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  admin_notes TEXT,
  linked_accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  opened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_action TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trust_review_cases DROP CONSTRAINT IF EXISTS trust_review_cases_status_check;
ALTER TABLE public.trust_review_cases
  ADD CONSTRAINT trust_review_cases_status_check
  CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed'));

ALTER TABLE public.trust_review_cases DROP CONSTRAINT IF EXISTS trust_review_cases_priority_check;
ALTER TABLE public.trust_review_cases
  ADD CONSTRAINT trust_review_cases_priority_check
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE public.trust_review_cases DROP CONSTRAINT IF EXISTS trust_review_cases_type_check;
ALTER TABLE public.trust_review_cases
  ADD CONSTRAINT trust_review_cases_type_check
  CHECK (case_type IN (
    'escalated_user', 'suspicious_listing', 'complaint_pattern', 'multi_account',
    'failed_verification', 'suspicious_pricing', 'duplicate_media', 'device_anomaly', 'manual'
  ));

CREATE INDEX IF NOT EXISTS trust_review_cases_queue_idx
  ON public.trust_review_cases (status, priority, suspicion_score DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.trust_admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trust_admin_notes_user_idx
  ON public.trust_admin_notes (user_id, created_at DESC);

ALTER TABLE public.trust_review_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_admin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trust_review_cases_staff ON public.trust_review_cases;
CREATE POLICY trust_review_cases_staff ON public.trust_review_cases
  FOR ALL USING (public.is_staff_admin());

DROP POLICY IF EXISTS trust_admin_notes_staff ON public.trust_admin_notes;
CREATE POLICY trust_admin_notes_staff ON public.trust_admin_notes
  FOR ALL USING (public.is_staff_admin());

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'set_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS trust_review_cases_updated_at ON public.trust_review_cases;
    CREATE TRIGGER trust_review_cases_updated_at
      BEFORE UPDATE ON public.trust_review_cases
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
