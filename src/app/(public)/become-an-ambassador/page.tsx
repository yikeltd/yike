import Link from "next/link";
import { PageHero } from "@/components/pages/page-hero";
import { SITE_NAME } from "@/lib/constants";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { AmbassadorApplicationForm } from "@/components/ambassador/ambassador-application-form";
import { createVerifiedAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { cityHasCapacity } from "@/lib/ambassador/slots";

export const metadata = {
  title: `Become a City Ambassador — ${SITE_NAME}`,
  description:
    "Help grow Yike in your city and earn commission from verified business onboardings.",
};

const BENEFITS = [
  "Flexible commission-based earning",
  "No salary dependence — performance-driven",
  "Grow your local property network",
  "Earn from real platform revenue",
  "Mobile-first ambassador dashboard",
];

const RESPONSIBILITIES = [
  "Onboard agents, developers, and property businesses",
  "Educate local businesses on quality listings",
  "Share your referral link responsibly",
  "Help improve trust in your city",
];

async function getOpenCities() {
  if (!isAdminClientConfigured()) {
    return [];
  }
  const admin = await createVerifiedAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("city_ambassador_slots")
    .select("city, state, max_slots, active_slots, recruitment_paused, active")
    .eq("active", true)
    .order("city");
  return (data ?? []).map((row) => ({
    city: row.city,
    state: row.state,
    open: cityHasCapacity(row as Parameters<typeof cityHasCapacity>[0]),
  }));
}

export default async function BecomeAmbassadorPage() {
  const cities = await getOpenCities();

  return (
    <div className="pb-12">
      <PageHero
        title="Become a Yike City Ambassador"
        subtitle="Help grow Yike in your city and earn commission from verified business onboardings."
        image={PAGE_IMAGERY.premium}
        badge="Growth partners"
        cta={{ label: "Apply now", href: "#apply" }}
        secondaryCta={{ label: "Ambassador dashboard", href: "/ambassador" }}
        variant="premium"
      />

      <section className="mx-auto max-w-5xl px-3 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-navy">What ambassadors do</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {RESPONSIBILITIES.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-gold">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-navy">How commission works</h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Earn recurring commission on net revenue when businesses you onboard pay for premium plans,
                featured listings, boosts, and other approved monetized services. No payment from Yike means no
                commission — we only share real revenue.
              </p>
              <p className="mt-2 text-sm font-semibold text-navy">Default rate: 10% of net revenue</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-navy">Why join</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {BENEFITS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-gold">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div id="apply">
            <h2 className="mb-3 text-xl font-bold text-navy">Apply now</h2>
            <AmbassadorApplicationForm />
            <p className="mt-3 text-xs text-muted">
              Applications are reviewed manually. This is a commission partnership — not employment or MLM.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-surface bg-surface/40 px-3 py-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-navy">Cities available</h2>
          <p className="mt-1 text-sm text-muted">Limited slots per city — controlled growth, city by city.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {cities.map((c) => (
              <span
                key={`${c.city}-${c.state}`}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  c.open ? "bg-gold/20 text-navy" : "bg-white text-muted border border-surface"
                }`}
              >
                {c.city} {c.open ? "· open" : "· waitlist"}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Already approved?{" "}
            <Link href="/ambassador" className="font-bold text-gold-dark hover:underline">
              Open your dashboard
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
