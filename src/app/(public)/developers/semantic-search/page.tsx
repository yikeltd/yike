import type { Metadata } from "next";
import { SemanticSearchDashboard } from "@/components/developers/semantic-search-dashboard";

export const metadata: Metadata = {
  title: "AI Semantic Search Engine & Intent Parser | Yike Developer Platform",
  description: "Natural-language query processing, 1536-dimensional vector embedding similarity matching, and hybrid BM25 retrieval.",
};

export default function DeveloperSemanticSearchPage() {
  return (
    <main>
      <SemanticSearchDashboard />
    </main>
  );
}
