/** Google Play / app-store review accounts — password login, no phone OTP on signup. */
export const REVIEWER_ACCOUNT_EMAILS = [
  "reviewer@yike.ng",
  "adminreview@yike.ng",
] as const;

export function isReviewerAccountEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (REVIEWER_ACCOUNT_EMAILS as readonly string[]).includes(normalized);
}
