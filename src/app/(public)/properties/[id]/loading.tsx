export default function PropertyDetailLoading() {
  return (
    <div className="safe-bottom-detail">
      <div className="skeleton aspect-[4/5] w-full rounded-none" />
      <div className="space-y-4 px-4 pt-5">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-6 w-full max-w-sm" />
        <div className="skeleton h-4 w-40" />
        <div className="flex gap-2">
          <div className="skeleton h-8 w-20 rounded-full" />
          <div className="skeleton h-8 w-20 rounded-full" />
        </div>
        <div className="skeleton h-28 w-full rounded-2xl" />
        <div className="skeleton h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}
