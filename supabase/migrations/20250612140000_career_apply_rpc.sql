-- Submit career applications via server token (no service-role key required on Vercel)

CREATE OR REPLACE FUNCTION yike_career_submit_application(
  p_token text,
  p_job_id uuid,
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_address text,
  p_city text,
  p_state text,
  p_age_range text,
  p_education_level text,
  p_current_occupation text,
  p_why_apply text,
  p_years_experience int,
  p_cv_url text,
  p_facebook text,
  p_instagram text,
  p_tiktok text,
  p_github text,
  p_linkedin text,
  p_portfolio text,
  p_stack_experience text,
  p_extra_answers jsonb,
  p_score int,
  p_score_breakdown jsonb,
  p_status text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_published boolean;
BEGIN
  PERFORM yike_assert_otp_token(p_token);

  SELECT EXISTS (
    SELECT 1 FROM jobs WHERE id = p_job_id AND status = 'published'
  ) INTO v_published;

  IF NOT v_published THEN
    RAISE EXCEPTION 'role_not_found';
  END IF;

  INSERT INTO job_applications (
    job_id,
    full_name,
    email,
    whatsapp,
    address,
    city,
    state,
    age_range,
    education_level,
    current_occupation,
    why_apply,
    years_experience,
    cv_url,
    facebook,
    instagram,
    tiktok,
    github,
    linkedin,
    portfolio,
    stack_experience,
    extra_answers,
    score,
    score_breakdown,
    status,
    source
  ) VALUES (
    p_job_id,
    p_full_name,
    p_email,
    p_whatsapp,
    NULLIF(p_address, ''),
    p_city,
    p_state,
    p_age_range,
    p_education_level,
    p_current_occupation,
    p_why_apply,
    COALESCE(p_years_experience, 0),
    NULLIF(p_cv_url, ''),
    NULLIF(p_facebook, ''),
    NULLIF(p_instagram, ''),
    NULLIF(p_tiktok, ''),
    NULLIF(p_github, ''),
    NULLIF(p_linkedin, ''),
    NULLIF(p_portfolio, ''),
    NULLIF(p_stack_experience, ''),
    COALESCE(p_extra_answers, '{}'::jsonb),
    COALESCE(p_score, 0),
    COALESCE(p_score_breakdown, '{}'::jsonb),
    p_status::application_status,
    'careers'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION yike_career_submit_application(
  text, uuid, text, text, text, text, text, text, text, text, text, text, int,
  text, text, text, text, text, text, text, text, jsonb, int, jsonb, text
) TO anon, authenticated, service_role;
