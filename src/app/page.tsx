import Link from "next/link";
import { Icon } from "@/components/icons";
import { Badge, Card, PageHeader, SectionHeading } from "@/components/ui";
import {
  demoInquiries,
  inquiriesInStage,
  pipelineStages,
  type DemoInquiry,
  type InquirySource,
} from "@/lib/demo-data";
import { moduleStatusLabel, primaryNav, secondaryNav } from "@/lib/navigation";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatEventDate(isoDate: string) {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

export default function DashboardPage() {
  // All figures are counts derived from the fictional dataset, not business metrics.
  const summary = [
    {
      label: "Open inquiries",
      value: demoInquiries.filter((i) => i.stage !== "confirmed").length,
      hint: "Not yet confirmed",
    },
    { label: "New to review", value: inquiriesInStage("new").length, hint: "Awaiting first review" },
    {
      label: "Missing details",
      value: inquiriesInStage("needs-details").length,
      hint: "Need client follow-up",
    },
    { label: "Confirmed events", value: inquiriesInStage("confirmed").length, hint: "Booked" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Catering overview"
        description="A preview of how catering inquiries will move from first contact to a confirmed event. Everything on this page is fictional sample data. Inquiries imported through the Zapier pilot are listed separately on the Inquiries page."
        badge={<Badge tone="sample">Sample data</Badge>}
      />

      <section aria-labelledby="summary-heading" className="mb-12">
        <h2 id="summary-heading" className="sr-only">
          Summary of sample inquiries
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <li key={item.label}>
              <Card className="flex h-full flex-col gap-4 p-5 transition-shadow hover:shadow-md">
                <p className="text-sm font-medium text-muted">{item.label}</p>
                <p className="font-display text-4xl font-medium text-forest-900">{item.value}</p>
                <p className="flex items-center justify-between gap-2 text-xs text-muted">
                  <span>{item.hint}</span>
                  <span className="text-brass-700">Sample</span>
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pipeline-heading" className="mb-12">
        <SectionHeading
          id="pipeline-heading"
          title="Inquiry pipeline"
          description="Preview layout only. Inquiries cannot be opened, moved, or edited yet."
          badge={<Badge tone="sample">Fictional</Badge>}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {pipelineStages.map((stage) => {
            const items = inquiriesInStage(stage.id);
            const headingId = `stage-${stage.id}`;
            return (
              <section
                key={stage.id}
                aria-labelledby={headingId}
                className="flex flex-col rounded-2xl border border-linen bg-cream/60 p-3"
              >
                <header className="mb-3 flex items-baseline justify-between px-1.5 pt-1">
                  <div>
                    <h3 id={headingId} className="text-sm font-semibold text-forest-900">
                      {stage.label}
                    </h3>
                    <p className="text-xs text-muted">{stage.description}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-forest-700">
                    {/* Visible number is hidden from assistive tech; the sr-only text announces it once, with context. */}
                    <span aria-hidden="true">{items.length}</span>
                    <span className="sr-only">
                      {items.length} {items.length === 1 ? "sample inquiry" : "sample inquiries"} in{" "}
                      {stage.label}
                    </span>
                  </span>
                </header>
                {items.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {items.map((inquiry) => (
                      <li key={inquiry.id}>
                        <InquiryCard inquiry={inquiry} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed border-sand px-3 py-6 text-center text-xs text-muted">
                    No sample inquiries
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section aria-labelledby="sources-heading" className="lg:col-span-2">
          <SectionHeading
            id="sources-heading"
            title="Inquiry sources"
            description="Channels inquiries will arrive from. Only a limited Zapier pilot import exists so far."
          />
          <Card>
            <ul className="divide-y divide-linen">
              {sourceStatus.map((source) => (
                <li key={source.name} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-ink">{source.name}</p>
                    <p className="text-xs text-muted">{source.detail}</p>
                  </div>
                  <Badge tone="planned">{source.status}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section aria-labelledby="modules-heading" className="lg:col-span-3">
          <SectionHeading
            id="modules-heading"
            title="Modules"
            description="Each page is reachable now. Planned modules show what they will do once built."
          />
          <Card className="overflow-hidden">
            <ul className="grid gap-px bg-linen sm:grid-cols-2">
              {[...primaryNav, ...secondaryNav]
                .filter((item) => item.href !== "/")
                .map((item) => (
                  <li key={item.href} className="bg-white">
                    <Link
                      href={item.href}
                      className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-cream/70"
                    >
                      <span className="grid size-9 place-items-center rounded-lg bg-forest-50 text-forest-700">
                        <Icon name={item.icon} className="size-[18px]" />
                      </span>
                      <span className="flex-1 text-sm font-medium text-ink">{item.label}</span>
                      <span className="text-xs text-muted">
                        {moduleStatusLabel[item.status]}
                      </span>
                      <Icon
                        name="arrow-right"
                        className="size-4 text-muted transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  </li>
                ))}
            </ul>
          </Card>
        </section>
      </div>
    </>
  );
}

const sourceStatus: { name: string; detail: string; status: string }[] = [
  { name: "Zapier pilot import", detail: "Fictional records from one Zapier table, for one restaurant", status: "Pilot" },
  { name: "Connected email", detail: "Gmail via OAuth", status: "Not connected" },
  { name: "Web form", detail: "Embeddable inquiry form", status: "Not built" },
  { name: "Manual entry", detail: "Staff-entered inquiries", status: "Not built" },
];

const sourceTone: Record<InquirySource, string> = {
  Email: "bg-forest-50 text-forest-700",
  "Web form": "bg-brass-50 text-brass-700",
  Manual: "bg-cream text-muted",
};

function InquiryCard({ inquiry }: { inquiry: DemoInquiry }) {
  return (
    <article className="rounded-xl border border-linen bg-white p-3.5 shadow-card-raised">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug text-ink">{inquiry.eventName}</h4>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${sourceTone[inquiry.source]}`}
        >
          {inquiry.source}
        </span>
      </div>
      <p className="text-xs text-muted">{inquiry.contactName} (fictional)</p>
      <dl className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink">
        <div className="flex gap-1">
          <dt className="sr-only">Event date</dt>
          <dd>{formatEventDate(inquiry.eventDate)}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">Guests</dt>
          <dd>{inquiry.guestCount} guests</dd>
        </div>
      </dl>
      <p className="mt-2 border-t border-linen pt-2 text-xs text-muted">{inquiry.note}</p>
    </article>
  );
}
