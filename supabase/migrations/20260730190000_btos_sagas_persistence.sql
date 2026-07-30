-- Yike BTOS — Persistent Saga State & Recovery Schema
-- Migration: 20260730190000_btos_sagas_persistence.sql

CREATE TABLE IF NOT EXISTS public.btos_sagas (
  id TEXT PRIMARY KEY,
  saga_id TEXT NOT NULL UNIQUE,
  workspace_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  saga_type TEXT NOT NULL DEFAULT 'transaction_workflow',
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  pending_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  compensation_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS btos_sagas_workspace_idx ON public.btos_sagas(workspace_id);
CREATE INDEX IF NOT EXISTS btos_sagas_correlation_idx ON public.btos_sagas(correlation_id);
CREATE INDEX IF NOT EXISTS btos_sagas_status_idx ON public.btos_sagas(status);

ALTER TABLE public.btos_sagas ENABLE ROW LEVEL SECURITY;
CREATE POLICY btos_sagas_select ON public.btos_sagas FOR SELECT USING (true);
