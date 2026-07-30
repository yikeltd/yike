-- Yike BTOS — CQRS Materialized Read Projections Schema
-- Migration: 20260730180000_btos_cqrs_projections.sql

CREATE TABLE IF NOT EXISTS public.btos_read_projections (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL UNIQUE,
  projection_type TEXT NOT NULL DEFAULT 'workspace_summary',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_event_id TEXT,
  last_event_type TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS btos_read_projections_workspace_idx ON public.btos_read_projections(workspace_id);
CREATE INDEX IF NOT EXISTS btos_read_projections_type_idx ON public.btos_read_projections(projection_type);

ALTER TABLE public.btos_read_projections ENABLE ROW LEVEL SECURITY;
CREATE POLICY btos_read_projections_select ON public.btos_read_projections FOR SELECT USING (true);
