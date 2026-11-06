import Link from "next/link";

export function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg px-1 py-1"
      aria-label="Catering Concierge, go to dashboard"
    >
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-full border border-brass-400/70 bg-forest-800 font-display text-sm font-semibold tracking-wide text-brass-400"
      >
        CC
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-lg font-medium text-ivory">Catering Concierge</span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-forest-200">
          Restaurant operations
        </span>
      </span>
    </Link>
  );
}
