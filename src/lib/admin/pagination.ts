export const ADMIN_PAGE_SIZE = 50;

export function parseAdminPage(
  searchParams: { page?: string },
  pageSize = ADMIN_PAGE_SIZE
) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}

export function paginationMeta(
  total: number,
  page: number,
  pageSize = ADMIN_PAGE_SIZE
) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

export function buildAdminPageUrl(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number
): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) q.set(key, value);
  }
  if (page > 1) q.set("page", String(page));
  const qs = q.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
