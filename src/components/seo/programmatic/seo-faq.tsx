import type { SeoFaq } from "@/lib/seo/content";

export function SeoFAQ({ faqs, title = "Frequently asked questions" }: { faqs: SeoFaq[]; title?: string }) {
  if (faqs.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-navy lg:text-xl">{title}</h2>
      <dl className="mt-4 space-y-3">
        {faqs.map((faq) => (
          <div
            key={faq.q}
            className="rounded-xl bg-surface p-4 ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
          >
            <dt className="text-sm font-bold text-navy">{faq.q}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">{faq.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
