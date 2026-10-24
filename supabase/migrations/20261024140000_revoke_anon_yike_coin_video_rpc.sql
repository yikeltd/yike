-- PostgREST exposes the anon role; coin/video RPCs must be service_role only.
-- Prior migrations revoked PUBLIC/authenticated but Supabase may still grant anon EXECUTE.

REVOKE EXECUTE ON FUNCTION public.yike_ensure_coin_account(uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.yike_coin_credit(
  uuid, bigint, text, text, text, uuid, text, jsonb
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.yike_coin_debit(
  uuid, bigint, text, text, text, text, jsonb
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.yike_coin_reverse_debit(
  uuid, text, text, text
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.yike_video_try_consume_free_allowance(
  uuid, uuid, date, integer
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.yike_video_release_free_allowance(
  uuid
) FROM anon;

-- Idempotent re-assert service_role (matches prior GRANT migrations)
GRANT EXECUTE ON FUNCTION public.yike_ensure_coin_account(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.yike_coin_credit(
  uuid, bigint, text, text, text, uuid, text, jsonb
) TO service_role;

GRANT EXECUTE ON FUNCTION public.yike_coin_debit(
  uuid, bigint, text, text, text, text, jsonb
) TO service_role;

GRANT EXECUTE ON FUNCTION public.yike_coin_reverse_debit(
  uuid, text, text, text
) TO service_role;

GRANT EXECUTE ON FUNCTION public.yike_video_try_consume_free_allowance(
  uuid, uuid, date, integer
) TO service_role;

GRANT EXECUTE ON FUNCTION public.yike_video_release_free_allowance(
  uuid
) TO service_role;
