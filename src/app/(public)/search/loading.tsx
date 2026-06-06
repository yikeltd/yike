import { PropertyGridSkeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="space-y-3 bg-[#f7f8fb] px-3 pt-2">
      <div className="skeleton h-14 w-full rounded-xl" />
      <div className="skeleton h-11 w-full rounded-xl" />
      <PropertyGridSkeleton count={4} />
    </div>
  );
}
