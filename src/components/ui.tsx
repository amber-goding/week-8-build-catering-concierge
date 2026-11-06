/** Small presentational primitives shared across pages. */

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
}: {
  eyebrow: string;
  title: string;
  description: string;
  badge?: React.ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-700">{eyebrow}</p>
        {badge}
      </div>
      <h1 className="font-display text-3xl font-medium tracking-tight text-forest-900 sm:text-4xl">
        {title}
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted">{description}</p>
    </header>
  );
}

type BadgeTone = "sample" | "planned" | "neutral" | "forest";

const badgeTones: Record<BadgeTone, string> = {
  sample: "border-brass-100 bg-brass-50 text-brass-700",
  planned: "border-linen bg-cream text-muted",
  neutral: "border-linen bg-ivory text-muted",
  forest: "border-forest-100 bg-forest-50 text-forest-700",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-linen bg-white/70 shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeading({
  id,
  title,
  description,
  badge,
}: {
  id: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id={id} className="font-display text-xl font-medium text-forest-900">
          {title}
        </h2>
        {badge}
      </div>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
  );
}
