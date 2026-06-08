export function FormSection({
  title,
  hint,
  children,
  step,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  step?: number;
}) {
  return (
    <section className="rounded-2xl bg-elevated p-4 shadow-float">
      <div className="mb-3 flex items-start gap-2">
        {step !== undefined && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy">
            {step}
          </span>
        )}
        <div>
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
