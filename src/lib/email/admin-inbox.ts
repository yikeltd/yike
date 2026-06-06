/** Inbox for internal moderation / ops alerts. */
export function getAdminAlertInbox(): string {
  return process.env.ADMIN_ALERT_EMAIL?.trim() || "hello@yike.ng";
}
