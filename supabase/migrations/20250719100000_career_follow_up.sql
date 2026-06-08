-- Career follow-up questionnaire (shortlist screening before interview)

CREATE TYPE public.career_follow_up_status AS ENUM (
  'draft',
  'sent',
  'opened',
  'submitted',
  'expired',
  'cancelled'
);

CREATE TYPE public.career_follow_up_recommendation AS ENUM (
  'strong_fit',
  'possible_fit',
  'needs_interview',
  'not_suitable',
  'too_expensive',
  'unclear'
);

CREATE TABLE public.career_follow_up_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications (id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb,
  response_score jsonb,
  recommendation public.career_follow_up_recommendation,
  red_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.career_follow_up_status NOT NULL DEFAULT 'draft',
  admin_notes text,
  interview_notes text,
  interview_scheduled_at timestamptz,
  interview_link text,
  sent_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  sent_at timestamptz,
  opened_at timestamptz,
  submitted_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX career_follow_up_application_idx ON public.career_follow_up_requests (application_id);
CREATE INDEX career_follow_up_status_idx ON public.career_follow_up_requests (status);
CREATE INDEX career_follow_up_token_hash_idx ON public.career_follow_up_requests (token_hash);

CREATE TABLE public.career_follow_up_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  job_category public.role_category,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.career_follow_up_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_follow_up_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage career follow-ups"
  ON public.career_follow_up_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin manage follow-up templates"
  ON public.career_follow_up_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Public submit via server token (same pattern as career apply)
CREATE OR REPLACE FUNCTION public.yike_career_submit_follow_up(
  p_token text,
  p_request_id uuid,
  p_token_hash text,
  p_answers jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.career_follow_up_requests%ROWTYPE;
BEGIN
  PERFORM public.yike_assert_otp_token(p_token);

  SELECT * INTO v_row
  FROM public.career_follow_up_requests
  WHERE id = p_request_id
    AND token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'follow_up_not_found';
  END IF;

  IF v_row.status NOT IN ('sent', 'opened') THEN
    RAISE EXCEPTION 'follow_up_not_available';
  END IF;

  IF v_row.expires_at < now() THEN
    UPDATE public.career_follow_up_requests
    SET status = 'expired', updated_at = now()
    WHERE id = p_request_id;
    RAISE EXCEPTION 'follow_up_expired';
  END IF;

  UPDATE public.career_follow_up_requests
  SET
    answers = p_answers,
    status = 'submitted',
    submitted_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  RETURN p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.yike_career_submit_follow_up(text, uuid, text, jsonb)
  TO anon, authenticated, service_role;
