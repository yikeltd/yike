import type { Metadata } from "next";
import { RecommendationsDashboard } from "@/components/developers/recommendations-dashboard";

export const metadata: Metadata = {
  title: "AI Recommendation Engine & Personalization Hub | Yike Developer Platform",
  description: "Personalized discovery feeds, user preference vector profiles, item-to-item similarity, and trust-weighted ranking.",
};

export default function DeveloperRecommendationsPage() {
  return (
    <main>
      <RecommendationsDashboard />
    </main>
  );
}
