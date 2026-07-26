export default function DiscoverLoading() {
  return (
    <div className="flex h-[100dvh] flex-col bg-[#021433] lg:hidden">
      <div className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-6 w-28 animate-pulse rounded bg-white/15" />
      </div>
      <div className="mx-auto mt-2 w-full max-w-lg flex-1 px-3 pb-[calc(var(--bottom-nav-stack)+0.5rem)]">
        <div className="h-full animate-pulse rounded-[1.75rem] bg-white/10" />
      </div>
    </div>
  );
}
