import { writeAuditLogAsync } from "@/lib/admin/audit";
import type { UserRole } from "@/types/database";

export type PaymentAuditAction =
  | "payment_created"
  | "payment_initialized"
  | "payment_success"
  | "payment_failed"
  | "payment_refunded"
  | "promotion_activated"
  | "promotion_expired"
  | "verification_request_created"
  | "verification_approved"
  | "subscription_activated";

export function logPaymentAudit(input: {
  action: PaymentAuditAction;
  actorId: string;
  actorRole?: UserRole | "system";
  targetId?: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
}): void {
  writeAuditLogAsync({
    actor_id: input.actorId,
    actor_role: (input.actorRole ?? "agent_unverified") as UserRole,
    action: input.action,
    target_type: "payment_order",
    target_id: input.targetId,
    target_user_id: input.targetUserId,
    metadata: input.metadata,
  });
}
