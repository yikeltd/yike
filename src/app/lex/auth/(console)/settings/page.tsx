import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminPinSetupCard } from "@/components/admin/admin-pin-setup-card";
import { ReviewPublishingSettings } from "@/components/admin/review-publishing-settings";
import { getReviewPublishingMode } from "@/lib/platform-settings";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export default async function PlatformSettingsPage() {
  const reviewMode = await getReviewPublishingMode();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Platform settings"
        description="High-risk changes require admin PIN confirmation"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewPublishingSettings initialMode={reviewMode} />

        <SettingsCard title="Site identity">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Name</dt>
              <dd className="font-semibold text-navy">{SITE_NAME}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">URL</dt>
              <dd className="font-semibold text-navy">{SITE_URL}</dd>
            </div>
          </dl>
        </SettingsCard>

        <AdminPinSetupCard />

        <SettingsCard title="Security">
          <p className="text-sm text-muted">
            Admin PIN sessions expire after 10 minutes. Review deletions, agent
            suspension, and settings changes are audit-logged. Super admins can
            reset login PINs for users and agents, and admin PINs for staff, from
            their respective admin pages.
          </p>
        </SettingsCard>

        <SettingsCard title="Trust & reviews">
          <p className="text-sm text-muted">
            Moderate reviews at{" "}
            <a href="/lex/auth/reviews" className="text-gold-dark underline">
              Reviews
            </a>
            . Users must be logged in. One review per agent unless admin removes it.
          </p>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-navy">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
