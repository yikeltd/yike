import type { Metadata } from "next";
import { NotificationsPageView } from "./notifications-page-view";

export const metadata: Metadata = {
  title: "Notifications Center | Yike",
  description: "View escrow updates, lead alerts, saved search notifications, and trust verifications.",
};

export default function NotificationsPage() {
  return <NotificationsPageView />;
}
