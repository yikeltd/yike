-- Security advisor follow-up after financial_ledger_immutable_v1 + privileged columns.
-- Project: hlpojfurfldvcxfxhveg
--
-- 1) financial_ledger_reject_mutation — fixed search_path
-- 2) enforce_profiles_privileged_columns — revoke RPC EXECUTE from anon/authenticated
--    (trigger continues to fire; clients must not call via /rest/v1/rpc)

CREATE OR REPLACE FUNCTION public.financial_ledger_reject_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'financial_ledger_entries is append-only; % not allowed', TG_OP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.financial_ledger_reject_mutation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.financial_ledger_reject_mutation() TO postgres, service_role;

REVOKE EXECUTE ON FUNCTION public.enforce_profiles_privileged_columns() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_profiles_privileged_columns() TO postgres, service_role;

-- Defense in depth: same for the bypass helper if exposed
REVOKE EXECUTE ON FUNCTION public.yike_profiles_privileged_bypass() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.yike_profiles_privileged_bypass() TO postgres, service_role;

NOTIFY pgrst, 'reload schema';
