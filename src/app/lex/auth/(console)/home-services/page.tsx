import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminHomeServicesBoard } from "@/components/admin/admin-home-services-board";

export const metadata = {
  title: "Home Services (Internal)",
  robots: { index: false, follow: false },
};

export default function AdminHomeServicesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Home & Relocation Services"
        description="Internal preparation — movers, cleaners, electricians, relocation support. Not public until ENABLE_HOME_SERVICES is on."
      />
      <AdminHomeServicesBoard />
    </div>
  );
}
