import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export function ListingCardSkeleton({ layout = "mobile" }: { layout?: "mobile" | "desktop" }) {
  if (layout === "desktop") {
    return (
      <article className="overflow-hidden rounded-2xl bg-white shadow-float">
        <Skeleton className="aspect-[5/4] w-full rounded-none" />
        <div className="space-y-3 p-5">
          <Skeleton className="h-7 w-2/5" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-11 w-11 rounded-xl" />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="mx-2.5 overflow-hidden rounded-[1.25rem] bg-white shadow-float lg:mx-0">
      <Skeleton className="aspect-[5/6] w-full rounded-none sm:aspect-[4/5]" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-10 w-2/5" />
        <Skeleton className="h-4 w-3/5" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
    </article>
  );
}

export function PropertyGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div>
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-7">
        {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
          <ListingCardSkeleton key={`d-${i}`} layout="desktop" />
        ))}
      </div>
      <div className="lg:hidden">
        {Array.from({ length: count }).map((_, i) => (
          <ListingCardSkeleton key={`m-${i}`} />
        ))}
      </div>
    </div>
  );
}
