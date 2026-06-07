import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminNotificationsBoard } from "@/components/admin/admin-notifications-board";

export default async function AdminNotificationsPage() {
  const admin = createAdminClient();
  const { data } = admin
    ? await admin
        .from("admin_notification_campaigns")
        .select(
          "id, title, category, priority, target_type, status, recipient_count, sent_at, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [] };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notifications"
        description="Send targeted in-app messages to users, agents, and companies"
      />
      <AdminNotificationsBoard initialCampaigns={data ?? []} />
    </div>
  );
}
