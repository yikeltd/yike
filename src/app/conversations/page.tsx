import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listUserConversations } from "@/lib/conversations/service";
import { ConversationInboxClient } from "./inbox-client";

export const metadata = {
  title: "Inbox & Transaction Workspaces | Yike",
  description: "Manage active property and vehicle transaction conversations, offers, viewings, and inspections.",
};

export default async function ConversationsInboxPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login?next=/conversations");
  }

  const conversations = await listUserConversations(session.id);

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <ConversationInboxClient initialConversations={conversations} currentUserId={session.id} />
    </div>
  );
}
