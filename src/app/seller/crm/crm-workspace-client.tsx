"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Layers,
  LayoutDashboard,
  Shield,
  TrendingUp,
} from "lucide-react";
import type { LeadCard, PipelineStage, SellerCrmSnapshot } from "@/lib/seller-crm/types";
import { ActivityFeed } from "@/components/seller-crm/activity-feed";
import { InventoryHealthGrid } from "@/components/seller-crm/inventory-health-grid";
import { PipelineKanban } from "@/components/seller-crm/pipeline-kanban";
import { QuickActionsBar } from "@/components/seller-crm/quick-actions-bar";
import { InsightCard } from "@/components/intelligence/insight-card";
import { cn } from "@/lib/utils";

type TabId = "pipeline" | "inventory" | "activity" | "insights";

const TABS: Array<{ id: TabId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "pipeline", label: "Lead Pipeline", icon: Layers },
  { id: "inventory", label: "Inventory Health", icon: BarChart3 },
  { id: "activity", label: "Activity Feed", icon: Activity },
  { id: "insights", label: "Performance Insights", icon: TrendingUp },
];

export function CrmWorkspaceClient({
  initialSnapshot,
}: {
  initialSnapshot: SellerCrmSnapshot;
}) {
  const [snapshot, setSnapshot] = useState<SellerCrmSnapshot>(initialSnapshot);
  const [activeTab, setActiveTab] = useState<TabId>("pipeline");

  async function handleMoveStage(leadId: string, toStage: PipelineStage) {
    try {
      const res = await fetch("/api/seller-crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, toStage }),
      });
      const data = (await res.json()) as { lead?: LeadCard };
      if (data.lead) {
        setSnapshot((prev) => ({
          ...prev,
          pipeline: prev.pipeline.map((l) => (l.id === leadId ? { ...l, stage: toStage } : l)),
        }));
      }
    } catch {
      // Ignore transient error
    }
  }

  const m = snapshot.metrics;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold text-navy uppercase tracking-wider">
              Yike Business Cloud
            </span>
            <Link
              href={`/trust/${encodeURIComponent(snapshot.sellerId)}`}
              target="_blank"
              className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800"
            >
              <Shield className="h-3 w-3 text-emerald-700" /> Trust Score: {snapshot.trustScore}/100
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            {snapshot.sellerName} — Seller Success Platform
          </h1>
          <p className="mt-1 text-xs text-navy/70">
            Manage your leads, viewings, offers, inventory health, and deal pipeline in one calm workspace.
          </p>
        </div>
      </div>

      {/* One-Click Quick Shortcuts */}
      <QuickActionsBar sellerId={snapshot.sellerId} />

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-2xl border border-navy/10 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Active Leads</p>
          <p className="mt-1 text-2xl font-black text-navy">{m.activeConversationsCount}</p>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-gold/10 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/60">Offers Waiting</p>
          <p className="mt-1 text-2xl font-black text-navy">{m.pendingOffersCount}</p>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Scheduled Viewings</p>
          <p className="mt-1 text-2xl font-black text-navy">{m.scheduledViewingsCount}</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Pending Inspections</p>
          <p className="mt-1 text-2xl font-black text-amber-900">{m.pendingInspectionsCount}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Deals Closed</p>
          <p className="mt-1 text-2xl font-black text-emerald-900">{m.completedDealsCount}</p>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Unread Messages</p>
          <p className="mt-1 text-2xl font-black text-navy">{snapshot.unreadMessagesCount}</p>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-3xl border border-navy/10 bg-white p-1.5 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pressable flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all",
                activeTab === tab.id
                  ? "bg-navy text-white shadow-sm"
                  : "text-navy/70 hover:bg-navy/5 hover:text-navy"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {activeTab === "pipeline" && (
          <PipelineKanban leads={snapshot.pipeline} onMoveStage={handleMoveStage} />
        )}

        {activeTab === "inventory" && (
          <InventoryHealthGrid inventoryList={snapshot.inventoryHealth} />
        )}

        {activeTab === "activity" && (
          <ActivityFeed activities={snapshot.activityFeed} />
        )}

        {activeTab === "insights" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {snapshot.insights.map((ins) => (
              <InsightCard
                key={ins.id}
                insight={{
                  id: ins.id,
                  category: "seller",
                  title: ins.title,
                  priority: ins.trend === "down" ? "high" : "medium",
                  reason: `${ins.metricLabel}: ${ins.metricValue}`,
                  recommendation: ins.suggestion,
                  confidenceScore: 90,
                  sourcePlatform: "Intelligence Platform (CRM)",
                  action: { label: "Take Action", href: "/seller/crm" },
                  createdAt: new Date().toISOString(),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
