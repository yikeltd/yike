import { redirect } from "next/navigation";
import {
  CONSUMER_AUTH_DEFAULT_NEXT,
  safeConsumerAuthNext,
} from "@/lib/auth/safe-next-path";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string; from?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next
    ? safeConsumerAuthNext(params.next, CONSUMER_AUTH_DEFAULT_NEXT)
    : undefined;

  // Legacy ?role=agent → unified signup with listing note (no separate form)
  if (params.role === "agent" && params.from !== "listing") {
    const q = nextPath ? `?from=listing&next=${encodeURIComponent(nextPath)}` : "?from=listing";
    redirect(`/auth/signup${q}`);
  }

  const agentNote = params.from === "listing" || params.role === "agent";

  return (
    <SignupForm agentNote={agentNote} nextPath={nextPath} />
  );
}
