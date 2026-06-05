import Link from "next/link";

export function InternalLinkGrid({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  if (links.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="pressable block rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-navy hover:bg-gold/10"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
