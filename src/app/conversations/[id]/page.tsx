import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ConversationWorkspace } from "@/components/conversations/conversation-workspace";

export const metadata = {
  title: "Conversation | Yike",
  description: "Direct buyer & seller transaction conversation on Yike.",
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
    <div className="min-h-screen bg-[#f8fafc]">
      <ConversationWorkspace conversationId={id} currentUserId={session.id} />
    </div>
  );
}
