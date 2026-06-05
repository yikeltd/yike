import { requireAdmin } from "@/lib/auth";
import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/featured", label: "Featured" },
  { href: "/admin/ads", label: "Ads" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-navy/10 bg-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p className="text-lg font-bold text-gold">Yike Admin</p>
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
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
