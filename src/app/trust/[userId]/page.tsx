import type { Metadata } from "next";
import { getOrCreateTrustIdentity } from "@/lib/identity/service";
import { TrustPassportExperience } from "@/components/trust/trust-passport-experience";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const passport = await getOrCreateTrustIdentity(userId);
  return {
    title: `${passport.fullName} | Universal Trust Passport | Yike`,
    description: `View ${passport.fullName}'s verified NIN identity, CAC business status, trust score (${passport.trustScore}/100), and reputation metrics on Yike.`,
  };
}

export default async function TrustProfilePage({ params }: Props) {
  const { userId } = await params;
  const passport = await getOrCreateTrustIdentity(userId);

  const supabase = await createClient();
  let userListings = [];
  if (supabase) {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("agent_id", userId)
      .eq("status", "published")
      .limit(6);
    if (data) userListings = data;
  }

  return (
    <main>
      <TrustPassportExperience passport={passport} userListings={userListings} />
    </main>
  );
}
