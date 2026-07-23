import { cn } from "@/lib/utils";
import { BROWSE_GRID_CLASS, BROWSE_THUMB_ASPECT } from "@/lib/marketplace/browse-grid";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export function ListingCardSkeleton({
  layout = "mobile",
}: {
  layout?: "mobile" | "desktop";
}) {
  void layout;
  return (
    <article className="overflow-hidden rounded-xl bg-transparent">
      <Skeleton className={cn(BROWSE_THUMB_ASPECT, "w-full rounded-xl")} />
      <div className="space-y-1 pt-1.5">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-2.5 w-3/5" />
      </div>
    </article>
  );
}

export function PropertyGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={BROWSE_GRID_CLASS}>
      {Array.from({ length: Math.max(count, 8) }).map((_, i) => (
        <ListingCardSkeleton key={i} layout="desktop" />
      ))}
    </div>
  );
}
