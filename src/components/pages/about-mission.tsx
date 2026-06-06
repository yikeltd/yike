const MISSION_BLOCKS = [
  {
    title: "Fake listings waste your time",
    body: "Blurry photos, wrong prices and duplicate posts are everywhere. Renters deserve to see real homes before paying anyone.",
  },
  {
    title: "Housing search is stressful",
    body: "Scrolling Facebook groups, chasing agents and guessing which number to trust burns energy when you just need a place to live.",
  },
  {
    title: "WhatsApp agents, one feed",
    body: "Nigeria runs on WhatsApp — we bring listings into one visual marketplace so you browse first, then chat the agent directly.",
  },
  {
    title: "Built for how Nigerians search",
    body: "Photos before paragraphs. City-first discovery from Aba to Lagos. Inspect in person — we verify agents where we can, not every landlord claim.",
  },
];

export function AboutMissionSection() {
  return (
    <section className="mt-8 lg:mt-10">
      <p className="max-w-3xl text-base leading-relaxed text-muted lg:text-lg">
        Yike is a mobile-first Nigerian housing marketplace. We help renters and
        buyers discover real listings, contact agents on WhatsApp instantly, and
        skip the chaos of scattered posts and unverified numbers.
      </p>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted lg:text-base">
        We started Yike because property discovery still feels outdated —
        fragmented agents, outdated portals, and too many scams. Our goal is
        simple: make finding a home more trustworthy, visual, and stress-free.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:gap-4">
        {MISSION_BLOCKS.map((block) => (
          <div
            key={block.title}
            className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]"
          >
            <h2 className="font-bold text-navy">{block.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {block.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
