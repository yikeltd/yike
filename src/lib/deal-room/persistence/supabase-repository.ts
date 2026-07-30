/**
 * Yike BTOS — Supabase Production Persistence Repositories (Milestone 1)
 * Production-ready PostgreSQL/Supabase backing for all 12 BTOS domain aggregates.
 */

import { createClient } from "@/lib/supabase/server";

export interface PersistenceOptions {
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}

export class SupabaseDomainRepository<T extends { id: string; workspaceId: string; version: number }> {
  constructor(private tableName: string) {}

  public async save(entity: T): Promise<void> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const record = {
      ...entity,
      updated_at: now,
      version: (entity.version || 1) + 1,
    };

    if (supabase) {
      await supabase.from(this.tableName).upsert(record);
    }
  }

  public async getById(id: string): Promise<T | null> {
    const supabase = await createClient();
    if (!supabase) return null;

    const { data } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    return (data as unknown as T) || null;
  }

  public async getByWorkspace(workspaceId: string, options?: PersistenceOptions): Promise<T[]> {
    const supabase = await createClient();
    if (!supabase) return [];

    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("workspace_id", workspaceId);

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    if (options?.page && options?.pageSize) {
      const start = (options.page - 1) * options.pageSize;
      const end = start + options.pageSize - 1;
      query = query.range(start, end);
    }

    const { data } = await query;
    return (data as unknown as T[]) || [];
  }

  public async softDelete(id: string, actorId: string): Promise<void> {
    const supabase = await createClient();
    if (!supabase) return;

    await supabase
      .from(this.tableName)
      .update({
        deleted_at: new Date().toISOString(),
        status: "deleted",
      })
      .eq("id", id);
  }
}

// INSTANTIATE REPOSITORIES FOR ALL 12 BTOS DOMAINS
export const btosRepositories = {
  conversation: new SupabaseDomainRepository("btos_conversations"),
  negotiation: new SupabaseDomainRepository("btos_negotiations"),
  appointment: new SupabaseDomainRepository("btos_appointments"),
  communication: new SupabaseDomainRepository("btos_communications"),
  trust: new SupabaseDomainRepository("btos_verifications"),
  evidence: new SupabaseDomainRepository("btos_evidence"),
  execution: new SupabaseDomainRepository("btos_executions"),
  visualSession: new SupabaseDomainRepository("btos_visual_sessions"),
  intelligence: new SupabaseDomainRepository("btos_intelligence_requests"),
  settlement: new SupabaseDomainRepository("btos_settlements"),
  workflow: new SupabaseDomainRepository("btos_workflows"),
  lifecycle: new SupabaseDomainRepository("btos_lifecycles"),
};
