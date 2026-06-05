import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { adminPath } from "@/lib/admin-paths";

const links = [
  { href: adminPath("overview"), label: "Overview" },
  { href: adminPath("listings"), label: "Listings" },
  { href: adminPath("agents"), label: "Agents" },
  { href: adminPath("reports"), label: "Reports" },
  { href: adminPath("featured"), label: "Featured" },
  { href: adminPath("hot-picks"), label: "Hot picks" },
  { href: adminPath("ads"), label: "Ads" },
  { href: adminPath("banners"), label: "Banners" },
];

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-navy/10 bg-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <p className="text-lg font-bold text-gold">Yike Console</p>
            <Link
              href="/"
              className="text-xs text-white/50 hover:text-white/80"
            >
              Exit
            </Link>
          </div>
          <nav className="flex gap-4 overflow-x-auto text-sm lg:gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="whitespace-nowrap text-white/75 transition-colors hover:text-gold"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-10">{children}</main>
    </div>
  );
}
