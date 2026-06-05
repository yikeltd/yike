import Link from "next/link";
import { PropertyRail } from "./property-rail";
import { PageSection } from "./page-section";
import { PAGE_IMAGERY } from "@/constants/pageImagery";

export async function BudgetShowcase() {
  return (
    <section className="full-bleed mt-10 bg-surface lg:mt-14">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">
            Budget guide
          </p>
          <h2 className="mt-2 text-2xl font-bold text-navy lg:text-3xl">
            What ₦500k rent can get you
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted lg:text-base">
            In Aba, Enugu, Owerri and parts of Ibadan, ₦500k/year often covers a
            neat self contain or mini flat. In Lagos island areas, expect shared
            rooms or outskirts — always compare live listings and inspect before
            paying.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/search?type=rent&max_price=500000"
              className="pressable rounded-xl bg-gold px-5 py-3 text-sm font-bold text-navy"
            >
              Browse under ₦500k
            </Link>
            <Link
              href="/blog/what-500k-rent-can-get-you-in-aba"
              className="pressable rounded-xl bg-white px-5 py-3 text-sm font-bold text-navy shadow-float"
            >
              Read the guide
            </Link>
          </div>
        </div>
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy shadow-float-lg"
          style={{
            backgroundImage: `url(${PAGE_IMAGERY.budget500k})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </div>
      <PropertyRail
        title="Homes around ₦500k/year"
        subtitle="Affordable verified options nationwide"
        seeAllHref="/search?type=rent&max_price=500000"
        params={{ listing_type: "rent", max_price: 500_000 }}
        limit={8}
      />
    </section>
  );
}
