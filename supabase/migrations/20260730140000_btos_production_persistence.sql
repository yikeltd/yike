-- Yike Business Transaction OS (BTOS) Production Persistence Schema
-- Migration 20260730140000_btos_production_persistence.sql

CREATE TABLE IF NOT EXISTS public.btos_workspaces (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  agent_id TEXT,
  current_stage TEXT NOT NULL DEFAULT 'inquiry',
  ownership JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS btos_workspaces_listing_idx ON public.btos_workspaces(listing_id);
CREATE INDEX IF NOT EXISTS btos_workspaces_buyer_idx ON public.btos_workspaces(buyer_id);
CREATE INDEX IF NOT EXISTS btos_workspaces_seller_idx ON public.btos_workspaces(seller_id);

CREATE TABLE IF NOT EXISTS public.btos_settlements (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES public.btos_workspaces(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  settlement_status TEXT NOT NULL DEFAULT 'held',
  provider_id TEXT NOT NULL DEFAULT 'paystack',
  splits JSONB NOT NULL DEFAULT '[]'::jsonb,
  release_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS btos_settlements_workspace_idx ON public.btos_settlements(workspace_id);

CREATE TABLE IF NOT EXISTS public.btos_ledger_entries (
  id TEXT PRIMARY KEY,
  settlement_id TEXT NOT NULL REFERENCES public.btos_settlements(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  account_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  reference_hash TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS btos_ledger_settlement_idx ON public.btos_ledger_entries(settlement_id);
CREATE INDEX IF NOT EXISTS btos_ledger_workspace_idx ON public.btos_ledger_entries(workspace_id);

CREATE TABLE IF NOT EXISTS public.btos_workflows (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES public.btos_workspaces(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL,
  workflow_state TEXT NOT NULL DEFAULT 'active',
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_chain JSONB NOT NULL DEFAULT '[]'::jsonb,
  decision_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_step_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS btos_workflows_workspace_idx ON public.btos_workflows(workspace_id);

CREATE TABLE IF NOT EXISTS public.btos_lifecycles (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES public.btos_workspaces(id) ON DELETE CASCADE,
  lifecycle_state TEXT NOT NULL DEFAULT 'pending_completion',
  buyer_accepted BOOLEAN NOT NULL DEFAULT false,
  seller_accepted BOOLEAN NOT NULL DEFAULT false,
  buyer_accepted_at TIMESTAMPTZ,
  seller_accepted_at TIMESTAMPTZ,
  reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
  dispute JSONB,
  warranty JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS btos_lifecycles_workspace_idx ON public.btos_lifecycles(workspace_id);

-- RLS POLICIES FOR BTOS TABLES
ALTER TABLE public.btos_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_lifecycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY btos_workspaces_select ON public.btos_workspaces FOR SELECT USING (true);
CREATE POLICY btos_settlements_select ON public.btos_settlements FOR SELECT USING (true);
CREATE POLICY btos_ledger_entries_select ON public.btos_ledger_entries FOR SELECT USING (true);
CREATE POLICY btos_workflows_select ON public.btos_workflows FOR SELECT USING (true);
CREATE POLICY btos_lifecycles_select ON public.btos_lifecycles FOR SELECT USING (true);
