import Link from "next/link";
import { getSession, getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default async function PostPropertyPage() {
  const user = await getSession();

  if (user) {
    const profile = await getProfile(user.id);
    if (
      profile &&
      ["agent", "admin", "super_admin"].includes(profile.role)
    ) {
      redirect("/agent/listings/new");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-3 py-6 text-center lg:py-16">
      <div>
        <h1 className="text-2xl font-bold text-navy lg:text-4xl">
          List your property on Yike
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted lg:text-base">
          Free listings for agents, agencies, and landlords. Every listing is
          reviewed before it goes live.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 text-left shadow-float lg:p-8">
        <ul className="space-y-4 text-sm text-foreground lg:text-base">
          {[
            "WhatsApp contact required",
            "Minimum 3 photos",
            'Real prices only — no "call for price"',
            "Listings expire after 14 days (renew anytime)",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/auth/signup?role=agent"
        className="pressable inline-flex h-12 w-full max-w-sm items-center justify-center rounded-xl bg-gold text-sm font-bold text-navy shadow-glow-gold lg:h-14 lg:text-base"
      >
        Sign up as agent — it&apos;s free
      </Link>
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-gold-dark">
          Log in
        </Link>
      </p>
    </div>
  );
}
