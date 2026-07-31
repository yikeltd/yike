"use client";

import { DeveloperSubnav } from "./developer-subnav";
import { UserProfileVectorCard } from "./recommendations/user-profile-vector-card";
import { PersonalizedFeedSimulator } from "./recommendations/personalized-feed-simulator";
import { RecommendationMetricsDashboard } from "./recommendations/recommendation-metrics-dashboard";
import { Sparkles, ShieldCheck } from "lucide-react";

export function RecommendationsDashboard() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-gold" />
                AI Recommendation Engine & Personalization Hub
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                Personalized discovery feeds, user preference vector profiles, item-to-item similarity, and trust-weighted ranking.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-4 w-4" />
              <span>HYBRID RECOMMENDATIONS ACTIVE (+34.2% CTR LIFT)</span>
            </div>
          </div>
        </div>

        {/* 1. RECOMMENDATION METRICS DASHBOARD */}
        <RecommendationMetricsDashboard />

        {/* 2. USER PROFILE VECTOR CARD */}
        <UserProfileVectorCard />

        {/* 3. PERSONALIZED FEED SIMULATOR */}
        <PersonalizedFeedSimulator />

      </div>
    </div>
  );
}
