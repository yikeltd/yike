import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const isAgent = params.role === "agent";

  return (
    <SignupForm
      isAgent={isAgent}
      title={isAgent ? "List properties on Yike" : "Create your account"}
      subtitle={
        isAgent
          ? "Join as an agent or landlord — post listings, get WhatsApp leads, build trust."
          : "Save homes, browse smarter, and contact verified agents on WhatsApp."
      }
    />
  );
}
