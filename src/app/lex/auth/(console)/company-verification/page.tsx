import { createAdminClient } from "@/lib/supabase/admin";
import { AdminCompanyVerificationPanel } from "@/components/admin/admin-company-verification-panel";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";

export default async function CompanyVerificationAdminPage() {
  const supabase = createAdminClient();
  const { data } = supabase
    ? await supabase
        .from("company_verification_requests")
        .select(
          "*, company:profiles!company_verification_requests_company_id_fkey(id, full_name, company_name, email, phone)"
        )
        .in("status", ["pending", "under_review", "needs_more_info"])
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Company verification"
        description="Review CAC, applicant, and bank details. PIN required to approve or reject."
      />
      <AdminCompanyVerificationPanel requests={data ?? []} />
    </div>
  );
}
