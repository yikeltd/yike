import type { Metadata } from "next";
import { NotificationCenterModal } from "@/components/notifications/notification-center-modal";

export const metadata: Metadata = {
  title: "Notifications Center | Yike",
  description: "View escrow updates, lead alerts, saved search notifications, and trust verifications.",
};

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] dark:bg-[#021433] p-4 flex items-center justify-center">
      <NotificationCenterModal onClose={() => {}} />
    </main>
  );
}
