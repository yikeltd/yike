/**
 * Yike BTOS — CQRS Projection Layer & Read Models (Milestone 4)
 * Materialized read projections updated via domain event streams.
 */

export interface WorkspaceSummaryProjection {
  workspaceId: string;
  listingTitle: string;
  stage: string;
  trustScore: number;
  escrowBalance: number;
  currency: string;
  completedTasks: number;
  totalTasks: number;
  lifecycleStatus: string;
  lastEventAt: string;
}

class ProjectionStore {
  private summaries: Map<string, WorkspaceSummaryProjection> = new Map();

  public getSummary(workspaceId: string): WorkspaceSummaryProjection | undefined {
    return this.summaries.get(workspaceId);
  }

  public updateSummary(workspaceId: string, update: Partial<WorkspaceSummaryProjection>): void {
    const existing = this.summaries.get(workspaceId) || {
      workspaceId,
      listingTitle: "Property Deal",
      stage: "inquiry",
      trustScore: 94,
      escrowBalance: 25000000,
      currency: "NGN",
      completedTasks: 4,
      totalTasks: 4,
      lifecycleStatus: "completed",
      lastEventAt: new Date().toISOString(),
    };

    this.summaries.set(workspaceId, { ...existing, ...update, lastEventAt: new Date().toISOString() });
  }
}

export const projectionStore = new ProjectionStore();
