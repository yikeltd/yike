import { redirect } from "next/navigation";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string; from?: string }>;
}) {
  const params = await searchParams;

  // Legacy ?role=agent → unified signup with listing note (no separate form)
  if (params.role === "agent" && params.from !== "listing") {
    const q = params.next ? `?from=listing&next=${encodeURIComponent(params.next)}` : "?from=listing";
    redirect(`/auth/signup${q}`);
  }

  const agentNote = params.from === "listing" || params.role === "agent";

  return (
    <SignupForm agentNote={agentNote} nextPath={params.next} />
  );
}
