import { notFound } from "next/navigation";

export const metadata = {
  title: "Inbox & Transaction Workspaces | Yike",
  description: "Manage active property and vehicle transaction conversations, offers, viewings, and inspections.",
};

export default async function ConversationsInboxPage() {
  // Persistent marketplace messaging has not shipped. Do not expose the
  // development simulator as a consumer feature.
  notFound();
}
