import { PropertyGridSkeleton } from "@/components/ui/skeleton";

export default function SavedLoading() {
  return (
    <div className="space-y-4 px-3 pt-2">
      <div className="skeleton h-7 w-40 rounded-lg" />
      <PropertyGridSkeleton count={4} />
    </div>
  );
}
