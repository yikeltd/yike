import { redirect } from "next/navigation";

export const metadata = {
  title: "New listing | Yike",
  description: "Create a property, vehicle, or electronics listing on Yike.",
};

/** Legacy chooser — instant listing workspace replaces the category landing page. */
export default async function ChooseListingTypePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const key of ["category", "hint"] as const) {
    const v = sp[key];
    if (typeof v === "string" && v.trim()) qs.set(key, v.trim());
  }
  const tail = qs.toString();
  redirect(tail ? `/agent/listings/new?${tail}` : "/agent/listings/new");
}
