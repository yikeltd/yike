import Link from "next/link";
import type { ProfileSocialStats } from "@/lib/social/types";
import { cn } from "@/lib/utils";

export function ProfileSocialStats({
  stats,
  className,
  centered,
  showLinks,
}: {
  stats: ProfileSocialStats;
  className?: string;
  centered?: boolean;
  showLinks?: boolean;
}) {
  const followers = stats.followersCount;
  const likes = stats.listingLikesCount;

  const content = (
    <>
      {showLinks ? (
        <>
          <Link href="/agent/followers" className="hover:text-navy hover:underline">
            {followers} {followers === 1 ? "follower" : "Followers"}
          </Link>
          <span aria-hidden> · </span>
          <span>
            {likes} {likes === 1 ? "listing like" : "Listing likes"}
          </span>
        </>
      ) : (
        <>
          {followers} {followers === 1 ? "follower" : "followers"} · {likes}{" "}
          {likes === 1 ? "listing like" : "listing likes"}
        </>
      )}
    </>
  );

  return (
    <p
      className={cn(
        "text-sm text-muted",
        centered && "text-center",
        className
      )}
    >
      {content}
    </p>
  );
}
