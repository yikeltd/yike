import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  const params = await searchParams;
  const isAgentIntent = params.role === "agent";
  const nextPath = params.next;

  // Unified signup — no separate agent form
  if (isAgentIntent && !nextPath) {
    // Show same page with agent note (no redirect needed)
  }

  return (
    <SignupForm
      agentNote={isAgentIntent}
      nextPath={nextPath}
    />
  );
}
