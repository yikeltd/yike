import type { AdminEntityType } from "@/lib/admin/entity-search/types";

export type AdminEntityItem = {
  id: string;
  display_name: string;
  subtitle: string;
  image_url: string | null;
  badge?: string | null;
  meta?: Record<string, string | number | boolean | null>;
};

export type AdminEntitySelectorProps = {
  entityType: AdminEntityType;
  selected: AdminEntityItem[];
  onChange: (next: AdminEntityItem[]) => void;
  mode?: "single" | "multi";
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: string[];
  filters?: {
    status?: string;
    verified?: boolean;
    city?: string;
    property_type?: string;
  };
  showPreview?: boolean;
  className?: string;
};

export const ENTITY_PLACEHOLDERS: Record<AdminEntityType, string> = {
  listing: "Search listings by title, area, city, agent…",
  user: "Search users by name, email, phone…",
  agent: "Search agents by name, email, code…",
  company: "Search companies by name, owner…",
  staff: "Search staff by name, email, role…",
  verifier: "Search verifiers by name, code, city…",
  ambassador: "Search ambassadors by name, code, city…",
  legal_partner: "Search legal partners by firm, code…",
};
