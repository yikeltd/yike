-- BTOS is not a public marketplace surface. These policies replace the
-- prototype-wide SELECT policies with participant- or staff-only access.
-- Existing rows are preserved; this migration changes access control only.

DROP POLICY IF EXISTS btos_workspaces_select ON public.btos_workspaces;
DROP POLICY IF EXISTS btos_settlements_select ON public.btos_settlements;
DROP POLICY IF EXISTS btos_ledger_entries_select ON public.btos_ledger_entries;
DROP POLICY IF EXISTS btos_workflows_select ON public.btos_workflows;
DROP POLICY IF EXISTS btos_lifecycles_select ON public.btos_lifecycles;
DROP POLICY IF EXISTS btos_conversations_select ON public.btos_conversations;
DROP POLICY IF EXISTS btos_negotiations_select ON public.btos_negotiations;
DROP POLICY IF EXISTS btos_appointments_select ON public.btos_appointments;
DROP POLICY IF EXISTS btos_communications_select ON public.btos_communications;
DROP POLICY IF EXISTS btos_verifications_select ON public.btos_verifications;
DROP POLICY IF EXISTS btos_evidence_select ON public.btos_evidence;
DROP POLICY IF EXISTS btos_executions_select ON public.btos_executions;
DROP POLICY IF EXISTS btos_visual_sessions_select ON public.btos_visual_sessions;
DROP POLICY IF EXISTS btos_intelligence_requests_select ON public.btos_intelligence_requests;
DROP POLICY IF EXISTS btos_read_projections_select ON public.btos_read_projections;
DROP POLICY IF EXISTS btos_sagas_select ON public.btos_sagas;

CREATE OR REPLACE FUNCTION public.can_read_btos_workspace(p_workspace_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_staff_admin()
    OR EXISTS (
      SELECT 1
      FROM public.btos_workspaces w
      WHERE w.id = p_workspace_id
        AND auth.uid() IS NOT NULL
        AND auth.uid()::text IN (w.buyer_id, w.seller_id, COALESCE(w.agent_id, ''))
    );
$$;

CREATE POLICY btos_workspaces_select ON public.btos_workspaces
  FOR SELECT USING (public.can_read_btos_workspace(id));
CREATE POLICY btos_settlements_select ON public.btos_settlements
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_ledger_entries_select ON public.btos_ledger_entries
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_workflows_select ON public.btos_workflows
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_lifecycles_select ON public.btos_lifecycles
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_conversations_select ON public.btos_conversations
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_negotiations_select ON public.btos_negotiations
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_appointments_select ON public.btos_appointments
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_communications_select ON public.btos_communications
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_verifications_select ON public.btos_verifications
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_evidence_select ON public.btos_evidence
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_executions_select ON public.btos_executions
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_visual_sessions_select ON public.btos_visual_sessions
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_intelligence_requests_select ON public.btos_intelligence_requests
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_read_projections_select ON public.btos_read_projections
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));
CREATE POLICY btos_sagas_select ON public.btos_sagas
  FOR SELECT USING (public.can_read_btos_workspace(workspace_id));

-- Enforce the minimum category contract for all rows created after this
-- migration without invalidating historic marketplace data.
ALTER TABLE public.properties
  ADD CONSTRAINT properties_vehicle_core_fields_check
  CHECK (
    asset_type <> 'VEHICLE'
    OR (
      property_type IS NULL
      AND listing_type = 'sale'
      AND NULLIF(BTRIM(make), '') IS NOT NULL
      AND NULLIF(BTRIM(model), '') IS NOT NULL
      AND year IS NOT NULL AND year >= 1980
      AND price > 0
      AND NULLIF(BTRIM(state), '') IS NOT NULL
      AND NULLIF(BTRIM(city), '') IS NOT NULL
      AND NULLIF(BTRIM(vehicle_condition), '') IS NOT NULL
    )
  ) NOT VALID;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_property_vehicle_separation_check
  CHECK (
    asset_type <> 'PROPERTY'
    OR (
      auto_category IS NULL
      AND make IS NULL AND model IS NULL AND year IS NULL AND trim IS NULL
      AND transmission IS NULL AND fuel_type IS NULL AND mileage IS NULL
      AND vin IS NULL AND exterior_color IS NULL AND interior_color IS NULL
      AND body_type IS NULL AND drivetrain IS NULL AND engine IS NULL
      AND registration_status IS NULL AND vehicle_condition IS NULL
      AND financing_available = FALSE
    )
  ) NOT VALID;
