import { SiteHeader } from "@/components/layout/site-header";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const isAgent = params.role === "agent";

  return (
    <>
      <SiteHeader compact />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold">
          {isAgent ? "Agent sign up" : "Create account"}
        </h1>
        <SignupForm isAgent={isAgent} />
      </main>
    </>
  );
}
