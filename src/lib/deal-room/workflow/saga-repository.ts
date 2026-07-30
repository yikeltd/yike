/**
 * Yike BTOS — Persistent Saga Repository Abstraction (Enterprise Enhancement 1 & 2)
 * Manages durable saga state checkpoints & recovery records in Supabase PostgreSQL.
 */

import { createClient } from "@/lib/supabase/server";

export interface PersistentSagaRecord {
  id: string;
  sagaId: string;
  workspaceId: string;
  correlationId: string;
  sagaType: string;
  currentStep: number;
  status: "pending" | "executing" | "waiting" | "retrying" | "completed" | "failed" | "compensated";
  completedSteps: string[];
  pendingSteps: string[];
  compensationStack: string[];
  retryCount: number;
  lastError?: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

export class SagaRepository {
  private static instance: SagaRepository;
  private memoryStore: Map<string, PersistentSagaRecord> = new Map();

  public static getInstance(): SagaRepository {
    if (!SagaRepository.instance) {
      SagaRepository.instance = new SagaRepository();
    }
    return SagaRepository.instance;
  }

  public async saveSaga(record: PersistentSagaRecord): Promise<void> {
    this.memoryStore.set(record.sagaId, record);

    const supabase = await createClient();
    if (!supabase) return;

    await supabase.from("btos_sagas").upsert({
      id: record.id,
      saga_id: record.sagaId,
      workspace_id: record.workspaceId,
      correlation_id: record.correlationId,
      saga_type: record.sagaType,
      current_step: record.currentStep,
      status: record.status,
      completed_steps: record.completedSteps,
      pending_steps: record.pendingSteps,
      compensation_stack: record.compensationStack,
      retry_count: record.retryCount,
      last_error: record.lastError,
      started_at: record.startedAt,
      updated_at: record.updatedAt,
      completed_at: record.completedAt,
    });
  }

  public async updateCheckpoint(
    sagaId: string,
    currentStep: number,
    completedSteps: string[],
    status: PersistentSagaRecord["status"] = "executing"
  ): Promise<void> {
    const existing = this.memoryStore.get(sagaId);
    if (existing) {
      existing.currentStep = currentStep;
      existing.completedSteps = completedSteps;
      existing.status = status;
      existing.updatedAt = new Date().toISOString();
      await this.saveSaga(existing);
    }
  }

  public async loadSaga(sagaId: string): Promise<PersistentSagaRecord | null> {
    const inMem = this.memoryStore.get(sagaId);
    if (inMem) return inMem;

    const supabase = await createClient();
    if (!supabase) return null;

    const { data } = await supabase
      .from("btos_sagas")
      .select("*")
      .eq("saga_id", sagaId)
      .maybeSingle();

    if (!data) return null;

    const record: PersistentSagaRecord = {
      id: data.id,
      sagaId: data.saga_id,
      workspaceId: data.workspace_id,
      correlationId: data.correlation_id,
      sagaType: data.saga_type,
      currentStep: data.current_step,
      status: data.status,
      completedSteps: data.completed_steps || [],
      pendingSteps: data.pending_steps || [],
      compensationStack: data.compensation_stack || [],
      retryCount: data.retry_count || 0,
      lastError: data.last_error,
      startedAt: data.started_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
    };

    this.memoryStore.set(sagaId, record);
    return record;
  }

  public async getResumableSagas(): Promise<PersistentSagaRecord[]> {
    // Only resume active in-flight sagas (executing, waiting, retrying)
    const resumableStatuses = ["executing", "waiting", "retrying"];
    const inMemResumable = Array.from(this.memoryStore.values()).filter((s) =>
      resumableStatuses.includes(s.status)
    );

    const supabase = await createClient();
    if (!supabase) return inMemResumable;

    const { data } = await supabase
      .from("btos_sagas")
      .select("*")
      .in("status", resumableStatuses);

    if (!data || data.length === 0) return inMemResumable;

    return data.map((d) => ({
      id: d.id,
      sagaId: d.saga_id,
      workspaceId: d.workspace_id,
      correlationId: d.correlation_id,
      sagaType: d.saga_type,
      currentStep: d.current_step,
      status: d.status,
      completedSteps: d.completed_steps || [],
      pendingSteps: d.pending_steps || [],
      compensationStack: d.compensation_stack || [],
      retryCount: d.retry_count || 0,
      lastError: d.last_error,
      startedAt: d.started_at,
      updatedAt: d.updated_at,
      completedAt: d.completed_at,
    }));
  }
}

export const sagaRepository = SagaRepository.getInstance();
