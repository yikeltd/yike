"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  findActiveNavGroupId,
  type AdminNavBadges,
  type NavGroup,
} from "@/lib/admin/navigation";

type Props = {
  groups: NavGroup[];
  badges?: AdminNavBadges;
  collapsed?: boolean;
  onNavigate?: () => void;
};

function isItemActive(pathname: string, href: string, overviewHref: string) {
  if (pathname === href) return true;
  if (href === overviewHref) return false;
  return pathname.startsWith(href + "/") || pathname.startsWith(href);
}

export function AdminSidebar({ groups, badges, collapsed, onNavigate }: Props) {
  const pathname = usePathname();
  const overviewHref = groups[0]?.items[0]?.href ?? "";
  const activeGroupId = findActiveNavGroupId(pathname, groups);

  const [expandedId, setExpandedId] = useState<string | null>(
    activeGroupId ?? groups.find((g) => g.defaultExpanded)?.id ?? "overview"
  );

  useEffect(() => {
    if (activeGroupId) setExpandedId(activeGroupId);
  }, [activeGroupId]);

  function toggleGroup(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/10 bg-navy-dark",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {groups.map((group) => {
          const expanded = expandedId === group.id || collapsed;
          const hasActive = group.items.some((item) =>
            isItemActive(pathname, item.href, overviewHref)
          );

          return (
            <div key={group.id} className="mb-1">
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "pressable flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors",
                    hasActive ? "text-gold" : "text-white/45 hover:text-white/70"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {group.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      expanded && "rotate-180"
                    )}
                  />
                </button>
              ) : null}

              {expanded ? (
                <ul
                  className={cn(
                    "space-y-0.5",
                    !collapsed && "mb-3 ml-1 border-l border-white/10 pl-2"
                  )}
                >
                  {group.items.map((item) => {
                    const active = isItemActive(pathname, item.href, overviewHref);
                    const badge =
                      item.badgeKey && badges?.[item.badgeKey]
                        ? badges[item.badgeKey]
                        : null;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                            item.emphasis === "muted" && "text-xs",
                            active
                              ? "bg-gold/15 font-semibold text-gold"
                              : item.emphasis === "primary"
                                ? "font-medium text-white/85 hover:bg-white/5 hover:text-white"
                                : item.emphasis === "muted"
                                  ? "text-white/45 hover:bg-white/5 hover:text-white/65"
                                  : "text-white/70 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            {!collapsed ? (
                              <NavIcon segment={item.segment} active={active} />
                            ) : null}
                            {!collapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </span>
                          {!collapsed && badge != null && badge > 0 ? (
                            <span className="shrink-0 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-navy">
                              {badge > 99 ? "99+" : badge}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function NavIcon({ segment, active }: { segment: string; active: boolean }) {
  const cls = cn("h-3.5 w-3.5 shrink-0", active ? "text-gold" : "text-white/40");
  switch (segment) {
    case "overview":
    case "":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      );
    case "reviews":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case "listings":
    case "listings/review":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 4l9 5.75M5 10v10h14V10" />
        </svg>
      );
    case "agents":
    case "staff":
    case "users":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8m13 8v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "reports":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      );
    case "leads":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case "featured":
    case "hot-picks":
    case "ads":
    case "banners":
    case "promo-banners":
    case "premium-deals":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    case "careers":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}
