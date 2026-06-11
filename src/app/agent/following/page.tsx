import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { ProfileFollowList } from "@/components/social/profile-follow-list";

export default async function FollowingPage() {
  await requireAuth("/auth/login?next=/agent/following");

  return (
    <div className="mx-auto max-w-lg space-y-4 px-3 py-4 lg:px-0 lg:py-8">
      <div className="flex items-center gap-3">
        <Link href="/agent" className="text-sm font-semibold text-navy">
          ← Profile
        </Link>
      </div>
      <div>
        <h1 className="text-xl font-bold text-navy">Following</h1>
        <p className="mt-1 text-sm text-muted">Sellers you follow on Yike.</p>
      </div>
      <ProfileFollowList
        endpoint="/api/social/following"
        emptyMessage="You're not following anyone yet."
      />
    </div>
  );
}
