-- Round-robin support dispatch cursor + atomic worker selection

INSERT INTO platform_settings (key, value)
VALUES ('support_dispatch_cursor', '0'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION yike_dispatch_support_worker()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workers uuid[];
  v_count int;
  v_cursor int := 0;
  v_assignee uuid;
BEGIN
  SELECT COALESCE(array_agg(id ORDER BY created_at ASC), ARRAY[]::uuid[])
  INTO v_workers
  FROM staff_profiles
  WHERE role = 'support' AND status = 'active';

  v_count := COALESCE(array_length(v_workers, 1), 0);
  IF v_count = 0 THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE((value #>> '{}')::int, 0)
  INTO v_cursor
  FROM platform_settings
  WHERE key = 'support_dispatch_cursor'
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO platform_settings (key, value)
    VALUES ('support_dispatch_cursor', '0'::jsonb);
    v_cursor := 0;
  END IF;

  v_assignee := v_workers[(v_cursor % v_count) + 1];

  UPDATE platform_settings
  SET
    value = to_jsonb((v_cursor + 1) % v_count),
    updated_at = NOW()
  WHERE key = 'support_dispatch_cursor';

  RETURN v_assignee;
END;
$$;

GRANT EXECUTE ON FUNCTION yike_dispatch_support_worker() TO service_role;
