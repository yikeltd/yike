-- Catch-up: intelligent review memory tables (production may have skipped 20250717200000)

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS review_overall_score INTEGER,
  ADD COLUMN IF NOT EXISTS review_risk_level TEXT,
  ADD COLUMN IF NOT EXISTS review_suggested_action TEXT,
  ADD COLUMN IF NOT EXISTS review_queue_group TEXT,
  ADD COLUMN IF NOT EXISTS review_scores JSONB,
  ADD COLUMN IF NOT EXISTS review_scores_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_visibility_modifier INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_hold_status TEXT NOT NULL DEFAULT 'none';

CREATE INDEX IF NOT EXISTS properties_review_queue_group_idx
  ON public.properties (review_queue_group, status)
  WHERE review_queue_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS properties_review_overall_idx
  ON public.properties (review_overall_score DESC NULLS LAST)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.listing_review_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  decision_type TEXT NOT NULL,
  decision_reason TEXT,
  signals JSONB NOT NULL DEFAULT '{}',
  property_type TEXT,
  listing_type TEXT,
  scores_snapshot JSONB,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_review_memory_listing_idx
  ON public.listing_review_memory (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_review_memory_agent_idx
  ON public.listing_review_memory (agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_review_memory_decision_idx
  ON public.listing_review_memory (decision_type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.listing_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.listing_review_requests DROP CONSTRAINT IF EXISTS listing_review_requests_status_check;
ALTER TABLE public.listing_review_requests
  ADD CONSTRAINT listing_review_requests_status_check
  CHECK (status IN ('open', 'responded', 'resolved', 'dismissed'));

CREATE INDEX IF NOT EXISTS listing_review_requests_listing_idx
  ON public.listing_review_requests (listing_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_review_requests_agent_idx
  ON public.listing_review_requests (agent_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_review_requests_requested_by_idx
  ON public.listing_review_requests (requested_by, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_review_requests_status_created_idx
  ON public.listing_review_requests (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.listing_review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.listing_review_requests(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  evidence_urls JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_review_responses_request_idx
  ON public.listing_review_responses (request_id, created_at DESC);

ALTER TABLE public.listing_review_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_review_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_review_memory_staff ON public.listing_review_memory;
CREATE POLICY listing_review_memory_staff ON public.listing_review_memory
  FOR ALL USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

DROP POLICY IF EXISTS listing_review_requests_staff ON public.listing_review_requests;
CREATE POLICY listing_review_requests_staff ON public.listing_review_requests
  FOR ALL USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

DROP POLICY IF EXISTS listing_review_requests_agent_select ON public.listing_review_requests;
CREATE POLICY listing_review_requests_agent_select ON public.listing_review_requests
  FOR SELECT USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS listing_review_requests_agent_update ON public.listing_review_requests;
CREATE POLICY listing_review_requests_agent_update ON public.listing_review_requests
  FOR UPDATE
  USING (auth.uid() = agent_id)
  WITH CHECK (
    auth.uid() = agent_id
    AND status IN ('open', 'responded', 'resolved')
  );

DROP POLICY IF EXISTS listing_review_responses_staff ON public.listing_review_responses;
CREATE POLICY listing_review_responses_staff ON public.listing_review_responses
  FOR ALL USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

DROP POLICY IF EXISTS listing_review_responses_agent_insert ON public.listing_review_responses;
CREATE POLICY listing_review_responses_agent_insert ON public.listing_review_responses
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS listing_review_responses_agent_select ON public.listing_review_responses;
CREATE POLICY listing_review_responses_agent_select ON public.listing_review_responses
  FOR SELECT USING (auth.uid() = agent_id);

DROP TRIGGER IF EXISTS listing_review_requests_updated_at ON public.listing_review_requests;
CREATE TRIGGER listing_review_requests_updated_at
  BEFORE UPDATE ON public.listing_review_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

NOTIFY pgrst, 'reload schema';
