import { notFound } from "next/navigation";

export const metadata = {
  title: "Conversation | Yike",
  description: "Direct buyer & seller transaction conversation on Yike.",
};

export default async function ConversationPage({
  params: _params,
}: {
  params: Promise<{ id: string }>;
}) {
  // This route previously rendered an in-memory simulator. Keep the route
  // unavailable until a persistent, participant-authorized service exists.
  void _params;
  notFound();
}
