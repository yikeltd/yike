export type AccessChecklistKey =
  | "yike_dashboard"
  | "zoho_email"
  | "assigned_workspace"
  | "whatsapp_group"
  | "training_session"
  | "admin_approval";

export type AccessChecklist = Partial<Record<AccessChecklistKey, boolean>>;

export const ACCESS_CHECKLIST_ITEMS: {
  key: AccessChecklistKey;
  label: string;
  defaultChecked: boolean;
}[] = [
  { key: "yike_dashboard", label: "Yike Staff Dashboard", defaultChecked: true },
  { key: "zoho_email", label: "Zoho Work Email", defaultChecked: true },
  { key: "assigned_workspace", label: "Assigned Workspace", defaultChecked: true },
  { key: "whatsapp_group", label: "WhatsApp Team Group", defaultChecked: false },
  { key: "training_session", label: "Training Session", defaultChecked: false },
  { key: "admin_approval", label: "Admin Approval Complete", defaultChecked: false },
];

export function defaultAccessChecklist(): AccessChecklist {
  return Object.fromEntries(
    ACCESS_CHECKLIST_ITEMS.map((i) => [i.key, i.defaultChecked])
  ) as AccessChecklist;
}

export function checklistLabels(checklist: AccessChecklist): string[] {
  return ACCESS_CHECKLIST_ITEMS.filter((i) => checklist[i.key]).map((i) => i.label);
}
