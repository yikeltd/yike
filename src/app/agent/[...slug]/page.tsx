import { redirect } from "next/navigation";

const AGENT_ROUTE_ALIASES: Record<string, string> = {
  plans: "/agent/plans",
  pricing: "/agent/plans",
  verification: "/agent/verification",
  "profile-setup": "/agent/profile-setup",
};

export default async function AgentCatchAll({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const first = slug[0];
  if (first && AGENT_ROUTE_ALIASES[first]) {
    redirect(AGENT_ROUTE_ALIASES[first]);
  }
  redirect("/agent");
}
