import Link from "next/link";
import { buildAdminPageUrl, paginationMeta } from "@/lib/admin/pagination";
import { cn } from "@/lib/utils";

type Props = {
  basePath: string;
  total: number;
  page: number;
  pageSize?: number;
  params?: Record<string, string | undefined>;
  className?: string;
};

export function AdminPagination({
  basePath,
  total,
  page,
  pageSize,
  params = {},
  className,
}: Props) {
  const meta = paginationMeta(total, page, pageSize);
  if (meta.totalPages <= 1 && total <= (pageSize ?? 50)) {
    return total > 0 ? (
      <p className={cn("text-center text-xs text-muted", className)}>
        {total} total
      </p>
    ) : null;
  }

  const prevHref = buildAdminPageUrl(basePath, params, page - 1);
  const nextHref = buildAdminPageUrl(basePath, params, page + 1);

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm shadow-sm",
        className
      )}
      aria-label="Pagination"
    >
      <p className="text-xs text-muted tabular-nums">
        Page {meta.page} of {meta.totalPages}
        {total > 0 && ` · ${total} total`}
      </p>
      <div className="flex gap-2">
        {meta.hasPrev ? (
          <Link
            href={prevHref}
            className="pressable rounded-lg border border-navy/15 px-4 py-2 text-xs font-bold text-navy hover:bg-surface"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-navy/5 px-4 py-2 text-xs font-bold text-muted/50">
            Previous
          </span>
        )}
        {meta.hasNext ? (
          <Link
            href={nextHref}
            className="pressable rounded-lg bg-navy px-4 py-2 text-xs font-bold text-gold"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-navy/5 px-4 py-2 text-xs font-bold text-muted/50">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
