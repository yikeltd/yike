import { requireAuth } from "@/lib/auth";
import { UserNotificationsClient } from "@/components/notifications/user-notifications-client";

export default async function AgentNotificationsPage() {
  await requireAuth("/auth/login?next=/agent/notifications");
  return <UserNotificationsClient />;
}
