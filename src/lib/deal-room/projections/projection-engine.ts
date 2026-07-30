/**
 * Yike BTOS — CQRS Event-Driven Projection Engine (Milestone 4)
 * Listens to domain events and updates materialized read models without cross-domain querying.
 */

import type { TimelineEvent } from "../types";
import type {
  SettlementDashboardProjection,
  TrustDashboardProjection,
  WorkflowDashboardProjection,
  WorkspaceSummaryProjection,
} from "./types";
import { activeEventTransport } from "../events/transport";
import { createClient } from "@/lib/supabase/server";

export class ProjectionEngine {
  private static instance: ProjectionEngine;
  private memorySummaries: Map<string, WorkspaceSummaryProjection> = new Map();
  private memorySettlements: Map<string, SettlementDashboardProjection> = new Map();
  private memoryTrust: Map<string, TrustDashboardProjection> = new Map();
  private memoryWorkflows: Map<string, WorkflowDashboardProjection> = new Map();
  private isListening = false;

  public static getInstance(): ProjectionEngine {
    if (!ProjectionEngine.instance) {
      ProjectionEngine.instance = new ProjectionEngine();
    }
    return ProjectionEngine.instance;
  }

  public initialize(): void {
    if (this.isListening) return;

    activeEventTransport.subscribe("*", async (record) => {
      await this.handleEventProjection(record.payload);
    });

    this.isListening = true;
  }

  public async handleEventProjection(event: TimelineEvent): Promise<void> {
    const workspaceId = event.dealRoomId || (event as unknown as { workspaceId: string }).workspaceId;
    if (!workspaceId) return;

    // 1. Update Workspace Summary Read Model
    const summary = this.memorySummaries.get(workspaceId) || {
      workspaceId,
      listingId: "list_default",
      listingTitle: "High-Value Transaction Asset",
      stage: "inquiry",
      trustScore: 94,
      escrowBalance: 25000000,
      currency: "NGN",
      activeTaskCount: 1,
      completedTaskCount: 3,
      lifecycleStatus: "active",
      disputeOpen: false,
      lastEventTitle: event.title,
      lastEventAt: event.createdAt,
    };

    summary.lastEventTitle = event.title;
    summary.lastEventAt = event.createdAt;

    if (event.type === "payment_completed") {
      summary.stage = "settled";
    } else if (event.type === "deal_completed") {
      summary.lifecycleStatus = "completed";
    }

    this.memorySummaries.set(workspaceId, summary);
    await this.persistProjection(workspaceId, "workspace_summary", summary);
  }

  public getWorkspaceSummary(workspaceId: string): WorkspaceSummaryProjection | undefined {
    return this.memorySummaries.get(workspaceId);
  }

  private async persistProjection(
    workspaceId: string,
    projectionType: string,
    data: unknown
  ): Promise<void> {
    const supabase = await createClient();
    if (!supabase) return;

    await supabase.from("btos_read_projections").upsert({
      id: `proj_${workspaceId}_${projectionType}`,
      workspace_id: workspaceId,
      projection_type: projectionType,
      data,
      updated_at: new Date().toISOString(),
    });
  }
}

export const projectionEngine = ProjectionEngine.getInstance();
