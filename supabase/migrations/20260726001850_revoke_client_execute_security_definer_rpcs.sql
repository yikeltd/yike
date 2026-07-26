-- Harden SECURITY DEFINER RPCs: revoke client EXECUTE (anon/authenticated/PUBLIC).
-- These functions stay SECURITY DEFINER for aggregate/counter writes that RLS cannot express.
-- App call sites use service_role (admin) only — clears advisor lints 0028/0029.
-- Project: hlpojfurfldvcxfxhveg

-- ---------------------------------------------------------------------------
-- Counter RPCs — already invoked only via Next.js admin clients
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.increment_property_views(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_property_views(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.increment_contact_clicks(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_contact_clicks(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Signup duplicate check — token-gated; called only via service_role admin client
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.yike_check_signup_duplicates(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.yike_check_signup_duplicates(text, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- Social aggregate RPCs — DEFINER required (RLS only allows own rows).
-- Client EXECUTE revoked; Next.js uses service_role for reads.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_listing_like_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_listing_like_count(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.get_profile_social_stats(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_social_stats(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.get_public_follow_profiles(uuid, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_follow_profiles(uuid, text, integer, integer)
  TO service_role;

NOTIFY pgrst, 'reload schema';
