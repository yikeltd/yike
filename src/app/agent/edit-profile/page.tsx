import Link from "next/link";
import { requireAuth, getOrCreateOwnProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BasicProfileForm } from "@/components/agent/basic-profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ChevronLeft } from "lucide-react";

/**
 * Account → Edit Profile for all signed-in users.
 * Unlike /agent/profile-setup, never redirects when the profile is already complete.
 */
export default async function EditProfilePage() {
  const user = await requireAuth("/auth/login?next=/agent/edit-profile");
  const profile = await getOrCreateOwnProfile(user);
  if (!profile || profile.is_banned) redirect("/");

  const displayName = profile.full_name ?? profile.username ?? "Your profile";
  const email = user.email ?? profile.email ?? "";

  return (
    <div className="mx-auto max-w-lg space-y-5 px-3 pb-10 pt-4">
      <div className="flex items-start gap-3">
        <Link
          href="/agent"
          className="pressable mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-navy/10 bg-white text-navy shadow-sm transition hover:border-gold/35 active:scale-[0.98]"
          aria-label="Back to account"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-navy">
            Edit profile
          </h1>
          <p className="mt-1 text-sm text-muted">
            Name, photo, and details shown on your Yike account.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/45">
          Profile photo
        </p>
        <div className="mt-3 flex items-center gap-4">
          <AvatarUpload
            userId={profile.id}
            email={email}
            name={displayName}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            size="lg"
          />
          <p className="text-xs leading-relaxed text-muted">
            Tap the photo to upload. A clear headshot helps buyers trust you.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-navy/45">
          Public details
        </p>
        <BasicProfileForm profile={profile} nextPath="/agent?saved=profile" />
      </section>
    </div>
  );
}
