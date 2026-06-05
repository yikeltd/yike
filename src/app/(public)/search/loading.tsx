import { PropertyGridSkeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="px-3 pt-2">
      <div className="skeleton mb-6 h-48 w-full rounded-2xl" />
      <PropertyGridSkeleton count={4} />
    </div>
  );
}
