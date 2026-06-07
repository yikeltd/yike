import Link from "next/link";
import { requireAuth, getProfile } from "@/lib/auth";
import { CompanyVerificationForm } from "@/components/agent/company-verification-form";

export default async function AgentCompanyPage() {
  const user = await requireAuth("/auth/login?next=/agent/company");
  const profile = await getProfile(user.id);

  return (
    <div className="space-y-6 px-3 pt-2 pb-8">
      <Link href="/agent" className="text-xs font-bold text-gold-dark">
        ← Agent hub
      </Link>
      <div>
        <h1 className="text-xl font-bold text-navy">Company profile</h1>
        <p className="mt-1 text-sm text-muted">
          Brand your company storefront and apply for business verification.
        </p>
      </div>

      {profile?.company_verified ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Your company is verified on Yike.
        </p>
      ) : (
        <CompanyVerificationForm />
      )}
    </div>
  );
}
