import { requireSuperAdmin } from "@/lib/auth";
import { createVerifiedAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AuthSyncPanel } from "@/components/admin/auth-sync-panel";
import { countAuthProfileGap } from "@/lib/auth/profile-repair";
import { isResendConfigured } from "@/lib/notifications/providers/resend";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { isEmailOtpEnabled } from "@/lib/feature-flags";

export default async function AuthSyncPage() {
  await requireSuperAdmin();

  const admin = await createVerifiedAdminClient();
  const gap = admin
    ? await countAuthProfileGap(admin)
    : { authCount: 0, profileCount: 0, missingCount: 0 };

  const { count: agentCount } = admin
    ? await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("role", ["agent", "agent_unverified", "agent_verified"])
    : { count: 0 };

  const { count: companyCount } = admin
    ? await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .or("account_type.eq.agency,account_type.eq.developer,company_name.not.is.null")
    : { count: 0 };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Auth sync health"
        description="Supabase auth users vs profile rows · email OTP wiring"
      />

      <AuthSyncPanel
        stats={{
          authCount: gap.authCount,
          profileCount: gap.profileCount,
          missingCount: gap.missingCount,
          agentCount: agentCount ?? 0,
          companyCount: companyCount ?? 0,
          emailOtpEnabled: isEmailOtpEnabled(),
          otpRpcReady: Boolean(createAuthEmailOtpDbClient()),
          resendReady: isResendConfigured(),
          adminReady: Boolean(admin),
        }}
      />
    </div>
  );
}
