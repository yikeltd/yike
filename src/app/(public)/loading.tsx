import { PropertyGridSkeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="pb-2">
      <div className="mb-3 px-3">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton mt-2 h-3 w-28" />
      </div>
      <PropertyGridSkeleton count={3} />
    </div>
  );
}
