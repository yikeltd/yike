-- Profile follows + listing likes (social trust layer)

CREATE TABLE IF NOT EXISTS public.profile_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_follows_no_self CHECK (follower_user_id <> followed_user_id),
  CONSTRAINT profile_follows_unique UNIQUE (follower_user_id, followed_user_id)
);

CREATE INDEX IF NOT EXISTS profile_follows_followed_idx
  ON public.profile_follows (followed_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS profile_follows_follower_idx
  ON public.profile_follows (follower_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.listing_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT listing_likes_unique UNIQUE (listing_id, user_id)
);

CREATE INDEX IF NOT EXISTS listing_likes_listing_idx
  ON public.listing_likes (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_likes_user_idx
  ON public.listing_likes (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.social_action_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT social_action_events_type_check
    CHECK (action_type IN ('follow', 'unfollow', 'like', 'unlike'))
);

CREATE INDEX IF NOT EXISTS social_action_events_user_action_idx
  ON public.social_action_events (user_id, action_type, created_at DESC);

ALTER TABLE public.profile_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_action_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY profile_follows_select_own ON public.profile_follows
  FOR SELECT
  USING (auth.uid() = follower_user_id OR auth.uid() = followed_user_id);

CREATE POLICY profile_follows_insert_own ON public.profile_follows
  FOR INSERT
  WITH CHECK (
    auth.uid() = follower_user_id
    AND follower_user_id <> followed_user_id
  );

CREATE POLICY profile_follows_delete_own ON public.profile_follows
  FOR DELETE
  USING (auth.uid() = follower_user_id);

CREATE POLICY listing_likes_select_own ON public.listing_likes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY listing_likes_insert_own ON public.listing_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY listing_likes_delete_own ON public.listing_likes
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY social_action_events_insert_own ON public.social_action_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY social_action_events_select_own ON public.social_action_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Aggregated public-safe stats
CREATE OR REPLACE FUNCTION public.get_profile_social_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'followers_count',
    COALESCE((
      SELECT COUNT(*)::INT
      FROM public.profile_follows pf
      WHERE pf.followed_user_id = p_user_id
    ), 0),
    'listing_likes_count',
    COALESCE((
      SELECT COUNT(*)::INT
      FROM public.listing_likes ll
      INNER JOIN public.properties p ON p.id = ll.listing_id
      WHERE p.agent_id = p_user_id
        AND p.status = 'approved'
    ), 0)
  );
$$;

REVOKE ALL ON FUNCTION public.get_profile_social_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_social_stats(UUID) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_listing_like_count(p_listing_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::INT, 0)
  FROM public.listing_likes
  WHERE listing_id = p_listing_id;
$$;

REVOKE ALL ON FUNCTION public.get_listing_like_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listing_like_count(UUID) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_public_follow_profiles(
  p_user_id UUID,
  p_direction TEXT,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  account_type TEXT,
  public_slug TEXT,
  company_name TEXT,
  followed_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pr.id,
    pr.full_name,
    pr.username,
    pr.avatar_url,
    pr.account_type,
    pr.public_slug,
    pr.company_name,
    pf.created_at AS followed_at
  FROM public.profile_follows pf
  INNER JOIN public.profiles pr ON pr.id = CASE
    WHEN p_direction = 'followers' THEN pf.follower_user_id
    ELSE pf.followed_user_id
  END
  WHERE CASE
    WHEN p_direction = 'followers' THEN pf.followed_user_id
    ELSE pf.follower_user_id
  END = p_user_id
    AND pr.is_banned = FALSE
    AND pr.profile_status IS DISTINCT FROM 'deleted'
  ORDER BY pf.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 100))
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION public.get_public_follow_profiles(UUID, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_follow_profiles(UUID, TEXT, INT, INT) TO authenticated, service_role;
