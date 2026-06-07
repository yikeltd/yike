export default function BrowseLoading() {
  return (
    <div className="relative h-[100dvh] bg-navy-dark lg:hidden">
      <div className="absolute inset-x-0 top-0 aspect-[5/6] skeleton opacity-30" />
      <div className="absolute inset-x-0 bottom-0 space-y-3 px-4 pb-[var(--bottom-edge-stack)]">
        <div className="skeleton h-8 w-32 rounded-lg opacity-40" />
        <div className="skeleton h-12 w-full rounded-2xl opacity-40" />
      </div>
    </div>
  );
}
