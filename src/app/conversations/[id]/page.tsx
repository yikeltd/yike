import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ConversationWorkspace } from "@/components/conversations/conversation-workspace";

export const metadata = {
  title: "Transaction Workspace | Yike",
  description: "Manage your listing inquiry, connect, viewing, and transaction actions on Yike.",
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/auth/login?next=/conversations/${encodeURIComponent(id)}`);
  }

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <ConversationWorkspace conversationId={id} currentUserId={session.id} />
    </div>
  );
}
