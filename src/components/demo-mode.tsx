import { Icon } from "@/components/icons";

/** Persistent notice at the top of every page while the app runs on sample data. */
export function DemoBanner() {
  return (
    <div
      role="note"
      aria-label="Demonstration mode"
      className="border-b border-brass-100 bg-brass-50 px-5 py-2.5 text-sm text-brass-700 sm:px-8 lg:px-12"
    >
      <p className="mx-auto flex max-w-6xl items-start gap-2.5 sm:items-center">
        <Icon name="flask" className="mt-0.5 size-4 shrink-0 sm:mt-0" />
        <span>
          <strong className="font-semibold">Demonstration mode.</strong> The dashboard&apos;s inquiries,
          names, and figures are fictional sample data. Your Google sign-in and restaurant name are real
          records. Inquiries imported through the Zapier pilot are stored for your restaurant, but
          they&apos;re fictional demonstration records and are labelled that way. No email inbox is
          connected, and the app itself calls no AI service.
        </span>
      </p>
    </div>
  );
}

/** Compact indicator for the sidebar footer. */
export function DemoPill() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-forest-700 bg-forest-800/60 px-3 py-2.5">
      <span className="relative flex size-2" aria-hidden="true">
        <span className="absolute inline-flex size-full rounded-full bg-brass-400 opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex size-2 rounded-full bg-brass-400" />
      </span>
      <span className="text-xs leading-snug text-forest-100">
        <span className="block font-semibold text-ivory">Demo mode</span>
        Sample data only
      </span>
    </div>
  );
}
