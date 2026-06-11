export type ProfileSocialStats = {
  followersCount: number;
  listingLikesCount: number;
};

export type PublicFollowProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  account_type: string | null;
  public_slug: string | null;
  company_name: string | null;
  followed_at: string;
};

export type FollowDirection = "followers" | "following";
