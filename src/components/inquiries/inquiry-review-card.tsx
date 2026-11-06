import { Badge } from "@/components/ui";
import type { InquiryReview } from "@/lib/inquiries";
import { formatReceivedAt } from "@/lib/inquiries";

/**
 * One imported inquiry with its AI review, for reading only.
 *
 * Both texts are untrusted. They render as React text (escaped, never as HTML),
 * and whitespace-pre-wrap keeps their line breaks readable. There are
 * deliberately no approve, send, edit, quote, or booking controls.
 */
export function InquiryReviewCard({ inquiry }: { inquiry: InquiryReview }) {
  const headingId = `inquiry-${inquiry.id}`;
  return (
    <article aria-labelledby={headingId} className="rounded-2xl border border-linen bg-white/80 p-5 shadow-card sm:p-6">
      <header className="flex flex-wrap items-center gap-2">
        <h3 id={headingId} className="text-sm font-semibold text-forest-900">
          Received <time dateTime={inquiry.receivedAt.toISOString()}>{formatReceivedAt(inquiry.receivedAt)}</time>
        </h3>
        {inquiry.isDemo && <Badge tone="sample">Demonstration data</Badge>}
        {inquiry.importedFromZapier && <Badge tone="neutral">Imported via Zapier</Badge>}
      </header>

      <section className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Original request</h4>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
          {inquiry.inquiryMessage ?? "No original message was stored for this inquiry."}
        </p>
      </section>

      <section className="mt-5 rounded-xl border border-brass-100 bg-brass-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brass-700">AI review</h4>
          <span className="rounded-full border border-brass-600 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-brass-700">
            AI-generated — requires human review
          </span>
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
          {inquiry.aiReview ?? "No AI review was stored for this inquiry."}
        </p>
      </section>
    </article>
  );
}
