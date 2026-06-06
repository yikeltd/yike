import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { FounderProfilePage } from "@/components/founder/founder-profile-page";
import { FounderSchema } from "@/components/founder/founder-schema";
import { FOUNDER } from "@/components/founder/founder-story-content";

const PAGE_URL = `${SITE_URL}/${FOUNDER.slug}`;

const DESCRIPTION =
  "Meet Odogwu Stankings — Nigerian tech entrepreneur, PropTech founder, and builder of Yike.ng. A resilience-driven founder story from Aba hustle to Dubai discipline, Stankings Autos, and real estate innovation in Nigeria.";

export const metadata: Metadata = {
  title: `${FOUNDER.name} — Founder of ${SITE_NAME} | Nigerian PropTech Entrepreneur`,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  keywords: [
    "Odogwu Stankings",
    "Yike founder",
    "Nigerian tech founder",
    "Nigerian entrepreneur",
    "Aba entrepreneur",
    "PropTech founder Nigeria",
    "real estate startup Nigeria",
    "Stankings Autos",
    "self-made entrepreneur Nigeria",
  ],
  openGraph: {
    title: `${FOUNDER.name} — Founder of ${SITE_NAME}`,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "profile",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${FOUNDER.name} | ${SITE_NAME} Founder`,
    description: DESCRIPTION,
  },
};

export default function FounderPage() {
  return (
    <>
      <FounderSchema />
      <FounderProfilePage />
    </>
  );
}
