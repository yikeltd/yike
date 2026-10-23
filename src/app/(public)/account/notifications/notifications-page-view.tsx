"use client";

import { NotificationCenterModal } from "@/components/notifications/notification-center-modal";

export function NotificationsPageView() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] dark:bg-[#021433] p-4 flex items-center justify-center">
      <NotificationCenterModal onClose={() => {}} />
    </main>
  );
}
