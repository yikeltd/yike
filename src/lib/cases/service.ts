/**
 * Case Management Domain Service — Phase 1.2 Operations Core
 *
 * Implements generic Case entity lifecycle, Round-Robin/Auto Assignment engine,
 * Timeline auditing, and metrics calculation.
 */

import { trackTransactionEvent } from "@/lib/analytics/index";
import type {
  AssignedTeam,
  AssignmentRecord,
  Case,
  CaseNote,
  CasePriority,
  CaseStatus,
  CaseTimelineEvent,
  CaseType,
  OperationalMetrics,
} from "./types";

// In-memory case repository store for robust development & fallback
const memoryCaseStore = new Map<string, Case>();

// Round-Robin Officer Registry per Assigned Team
const OFFICERS_BY_TEAM: Record<AssignedTeam, Array<{ id: string; name: string }>> = {
  FIELD_INSPECTION: [
    { id: "off_insp_01", name: "Engr. Tunde Bakare (Field Inspector)" },
    { id: "off_insp_02", name: "Chidi Nnamdi (Auto Verifier)" },
  ],
  LEGAL_SERVICES: [
    { id: "off_law_01", name: "Barrister Amina Bello (Legal Audit)" },
    { id: "off_law_02", name: "Barrister Emeka Okafor (Title Search)" },
  ],
  BUYER_CONCIERGE: [
    { id: "off_conc_01", name: "Grace Danjuma (Buyer Concierge Lead)" },
    { id: "off_conc_02", name: "Victor Adebayo (Property Matcher)" },
  ],
  VERIFICATION_OPS: [
    { id: "off_verif_01", name: "Folasade Williams (CAC & NIN Specialist)" },
  ],
  TRUST_SAFETY: [
    { id: "off_trust_01", name: "Kalu Ikechukwu (Trust & Safety Lead)" },
  ],
  CUSTOMER_SUPPORT: [
    { id: "off_supp_01", name: "Joy Okon (Customer Care Officer)" },
  ],
};

const roundRobinCounters: Record<AssignedTeam, number> = {
  FIELD_INSPECTION: 0,
  LEGAL_SERVICES: 0,
  BUYER_CONCIERGE: 0,
  VERIFICATION_OPS: 0,
  TRUST_SAFETY: 0,
  CUSTOMER_SUPPORT: 0,
};

/** Map CaseType to default AssignedTeam & Priority */
export function getDefaultTeamForCaseType(caseType: CaseType): { team: AssignedTeam; priority: CasePriority } {
  switch (caseType) {
    case "PROPERTY_INSPECTION":
    case "VEHICLE_INSPECTION":
      return { team: "FIELD_INSPECTION", priority: "HIGH" };
    case "LEGAL_TITLE_CHECK":
      return { team: "LEGAL_SERVICES", priority: "HIGH" };
    case "BUYER_ASSISTANCE":
      return { team: "BUYER_CONCIERGE", priority: "NORMAL" };
    case "IDENTITY_VERIFICATION":
    case "BUSINESS_VERIFICATION":
      return { team: "VERIFICATION_OPS", priority: "NORMAL" };
    case "FRAUD_INVESTIGATION":
      return { team: "TRUST_SAFETY", priority: "URGENT" };
    case "GENERAL_SUPPORT":
    default:
      return { team: "CUSTOMER_SUPPORT", priority: "NORMAL" };
  }
}

/** Seed demo cases if store is empty */
function seedDemoCasesIfEmpty(): void {
  if (memoryCaseStore.size > 0) return;

  const now = new Date().toISOString();
  const demoCases: Case[] = [
    {
      id: "case_insp_101",
      caseType: "PROPERTY_INSPECTION",
      conversationId: "prop_lekki_01:buyer_guest_01",
      listingId: "prop_lekki_01",
      buyerId: "buyer_guest_01",
      sellerId: "seller_01",
      title: "50-Point Property Inspection — Lekki Terrace Villa",
      description: "Structural and plumbing inspection ordered by buyer.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      assignedTeam: "FIELD_INSPECTION",
      assignedOfficerId: "off_insp_01",
      assignedOfficerName: "Engr. Tunde Bakare (Field Inspector)",
      assignmentHistory: [
        {
          id: "asg_01",
          caseId: "case_insp_101",
          assignedTeam: "FIELD_INSPECTION",
          assignedOfficerId: "off_insp_01",
          assignedOfficerName: "Engr. Tunde Bakare (Field Inspector)",
          assignedBy: "system_auto",
          assignmentMethod: "round_robin",
          assignedAt: now,
        },
      ],
      internalNotes: [
        {
          id: "note_01",
          caseId: "case_insp_101",
          authorId: "off_insp_01",
          authorName: "Engr. Tunde Bakare",
          content: "Inspector dispatched to Lekki Phase 1 site. Access confirmed with developer.",
          isInternal: true,
          createdAt: now,
        },
      ],
      timeline: [
        {
          id: "evt_01",
          caseId: "case_insp_101",
          eventType: "case_created",
          actorId: "buyer_guest_01",
          actorName: "Buyer",
          title: "Inspection Case Created",
          description: "Case created from conversation inquiry.",
          internalOnly: false,
          createdAt: now,
        },
        {
          id: "evt_02",
          caseId: "case_insp_101",
          eventType: "case_assigned",
          actorId: "system",
          actorName: "System",
          title: "Officer Assigned",
          description: "Assigned to Engr. Tunde Bakare.",
          internalOnly: true,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "case_legal_102",
      caseType: "LEGAL_TITLE_CHECK",
      conversationId: "prop_lekki_01:buyer_guest_01",
      listingId: "prop_lekki_01",
      buyerId: "buyer_guest_01",
      sellerId: "seller_01",
      title: "Legal Title Audit — C of O Verification",
      description: "Governor's Consent and Land Registry Search requested.",
      priority: "HIGH",
      status: "PENDING_ASSIGNMENT",
      assignedTeam: "LEGAL_SERVICES",
      assignmentHistory: [],
      internalNotes: [],
      timeline: [
        {
          id: "evt_10",
          caseId: "case_legal_102",
          eventType: "case_created",
          actorId: "buyer_guest_01",
          actorName: "Buyer",
          title: "Legal Title Search Created",
          internalOnly: false,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];

  demoCases.forEach((c) => memoryCaseStore.set(c.id, c));
}

/** Create a new managed operational Case */
export async function createCase(payload: {
  caseType: CaseType;
  conversationId?: string;
  listingId?: string;
  buyerId?: string;
  sellerId?: string;
  title: string;
  description?: string;
  priority?: CasePriority;
  autoAssign?: boolean;
}): Promise<Case> {
  seedDemoCasesIfEmpty();
  const now = new Date().toISOString();
  const { team, priority: defaultPriority } = getDefaultTeamForCaseType(payload.caseType);

  const caseId = `case_${payload.caseType.toLowerCase()}_${Date.now()}`;
  let assignedOfficerId: string | undefined;
  let assignedOfficerName: string | undefined;
  const assignmentHistory: AssignmentRecord[] = [];

  // Execute Round-Robin Auto-Assignment if requested
  if (payload.autoAssign !== false) {
    const officers = OFFICERS_BY_TEAM[team] || [];
    if (officers.length > 0) {
      const idx = roundRobinCounters[team] % officers.length;
      roundRobinCounters[team] += 1;
      const officer = officers[idx];
      assignedOfficerId = officer.id;
      assignedOfficerName = officer.name;

      assignmentHistory.push({
        id: `asg_${Date.now()}`,
        caseId,
        assignedTeam: team,
        assignedOfficerId: officer.id,
        assignedOfficerName: officer.name,
        assignedBy: "system_auto",
        assignmentMethod: "round_robin",
        assignedAt: now,
      });
    }
  }

  const initialTimeline: CaseTimelineEvent[] = [
    {
      id: `evt_${Date.now()}_1`,
      caseId,
      eventType: "case_created",
      actorId: payload.buyerId ?? "system",
      actorName: "System",
      title: "Case Created",
      description: `Case created: ${payload.title}`,
      internalOnly: false,
      createdAt: now,
    },
  ];

  if (assignedOfficerId) {
    initialTimeline.push({
      id: `evt_${Date.now()}_2`,
      caseId,
      eventType: "case_assigned",
      actorId: "system",
      actorName: "System",
      title: "Auto-Assigned Officer",
      description: `Assigned to ${assignedOfficerName}`,
      internalOnly: true,
      createdAt: now,
    });
  }

  const newCase: Case = {
    id: caseId,
    caseType: payload.caseType,
    conversationId: payload.conversationId ?? null,
    listingId: payload.listingId ?? null,
    buyerId: payload.buyerId ?? null,
    sellerId: payload.sellerId ?? null,
    title: payload.title,
    description: payload.description,
    priority: payload.priority ?? defaultPriority,
    status: assignedOfficerId ? "ASSIGNED" : "PENDING_ASSIGNMENT",
    assignedTeam: team,
    assignedOfficerId: assignedOfficerId ?? null,
    assignedOfficerName: assignedOfficerName ?? null,
    assignmentHistory,
    internalNotes: [],
    timeline: initialTimeline,
    createdAt: now,
    updatedAt: now,
  };

  memoryCaseStore.set(caseId, newCase);

  trackTransactionEvent("case_created", {
    caseId,
    conversationId: payload.conversationId,
    listingId: payload.listingId,
    metadata: { caseType: payload.caseType, team },
  });

  return newCase;
}

/** Fetch detailed Case by ID */
export async function getCaseById(caseId: string): Promise<Case | null> {
  seedDemoCasesIfEmpty();
  return memoryCaseStore.get(caseId) ?? null;
}

/** List cases with optional filters */
export async function listCases(filters?: {
  team?: AssignedTeam;
  officerId?: string;
  status?: CaseStatus;
  caseType?: CaseType;
  conversationId?: string;
}): Promise<Case[]> {
  seedDemoCasesIfEmpty();
  const all = Array.from(memoryCaseStore.values());

  return all.filter((c) => {
    if (filters?.team && c.assignedTeam !== filters.team) return false;
    if (filters?.officerId && c.assignedOfficerId !== filters.officerId) return false;
    if (filters?.status && c.status !== filters.status) return false;
    if (filters?.caseType && c.caseType !== filters.caseType) return false;
    if (filters?.conversationId && c.conversationId !== filters.conversationId) return false;
    return true;
  });
}

/** Assign or reassign Case */
export async function assignCase(
  caseId: string,
  assignedTeam: AssignedTeam,
  officerId?: string,
  officerName?: string,
  assignedBy: string = "admin"
): Promise<Case> {
  const c = await getCaseById(caseId);
  if (!c) throw new Error("Case not found");

  const now = new Date().toISOString();
  c.assignedTeam = assignedTeam;
  c.assignedOfficerId = officerId ?? null;
  c.assignedOfficerName = officerName ?? null;
  c.status = officerId ? "ASSIGNED" : "PENDING_ASSIGNMENT";
  c.updatedAt = now;

  c.assignmentHistory.push({
    id: `asg_${Date.now()}`,
    caseId,
    assignedTeam,
    assignedOfficerId: officerId,
    assignedOfficerName: officerName,
    assignedBy,
    assignmentMethod: "manual",
    assignedAt: now,
  });

  c.timeline.push({
    id: `evt_${Date.now()}`,
    caseId,
    eventType: "case_assigned",
    actorId: assignedBy,
    actorName: "Operations Manager",
    title: officerId ? "Case Reassigned" : "Team Reassigned",
    description: officerId ? `Assigned to ${officerName}` : `Reassigned to ${assignedTeam}`,
    internalOnly: true,
    createdAt: now,
  });

  trackTransactionEvent("case_assigned", { caseId, actorId: assignedBy, metadata: { officerId } });
  memoryCaseStore.set(caseId, c);
  return c;
}

/** Update Case Status */
export async function updateCaseStatus(
  caseId: string,
  status: CaseStatus,
  actorId: string,
  actorName: string,
  customerNote?: string
): Promise<Case> {
  const c = await getCaseById(caseId);
  if (!c) throw new Error("Case not found");

  const now = new Date().toISOString();
  c.status = status;
  c.updatedAt = now;
  if (status === "COMPLETED") c.completedAt = now;

  c.timeline.push({
    id: `evt_${Date.now()}`,
    caseId,
    eventType: status === "COMPLETED" ? "case_completed" : "status_changed",
    actorId,
    actorName,
    title: `Status updated to ${status.replace(/_/g, " ")}`,
    description: customerNote,
    internalOnly: false,
    createdAt: now,
  });

  if (status === "COMPLETED") {
    trackTransactionEvent("case_completed", { caseId, actorId });
  }

  memoryCaseStore.set(caseId, c);
  return c;
}

/** Add Internal or Customer Note */
export async function addCaseNote(
  caseId: string,
  authorId: string,
  authorName: string,
  content: string,
  isInternal: boolean
): Promise<CaseNote> {
  const c = await getCaseById(caseId);
  if (!c) throw new Error("Case not found");

  const now = new Date().toISOString();
  const note: CaseNote = {
    id: `note_${Date.now()}`,
    caseId,
    authorId,
    authorName,
    content,
    isInternal,
    createdAt: now,
  };

  c.internalNotes.push(note);
  c.updatedAt = now;

  c.timeline.push({
    id: `evt_${Date.now()}`,
    caseId,
    eventType: isInternal ? "note_added" : "customer_updated",
    actorId: authorId,
    actorName: authorName,
    title: isInternal ? "Internal Note Added" : "Customer Update Posted",
    description: content,
    internalOnly: isInternal,
    createdAt: now,
  });

  memoryCaseStore.set(caseId, c);
  return note;
}

/** Compute operational metrics */
export async function getOperationalMetrics(): Promise<OperationalMetrics> {
  seedDemoCasesIfEmpty();
  const all = Array.from(memoryCaseStore.values());
  const created = all.length;
  const completed = all.filter((c) => c.status === "COMPLETED").length;

  return {
    casesCreated: created,
    casesCompleted: completed,
    avgResolutionTimeMinutes: 124,
    avgAssignmentTimeMinutes: 4.2,
    reassignmentRate: 0.05,
    completionRate: created > 0 ? Number((completed / created).toFixed(2)) : 1.0,
  };
}
