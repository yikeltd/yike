import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Legacy callback path — redirect to /payments/callback (Processing only).
 */
export default async function PaymentVerifyRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  const suffix = qs.toString();
  redirect(suffix ? `/payments/callback?${suffix}` : "/payments/callback");
}
