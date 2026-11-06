import Link from "next/link";
import { Icon } from "@/components/icons";
import { Badge, Card, PageHeader } from "@/components/ui";

/**
 * Honest placeholder for a module that has a route but no functionality yet.
 * It describes what is planned and deliberately offers no action buttons.
 */
export function ModulePlaceholder({
  title,
  description,
  planned,
}: {
  title: string;
  description: string;
  planned: string[];
}) {
  return (
    <>
      <PageHeader
        eyebrow="Planned module"
        title={title}
        description={description}
        badge={<Badge tone="planned">Not yet built</Badge>}
      />

      <Card className="max-w-3xl p-6 sm:p-8">
        <h2 className="font-display text-lg font-medium text-forest-900">Planned capabilities</h2>
        <p className="mt-1 text-sm text-muted">
          Nothing on this page works yet. This list describes intended scope, not current behavior.
        </p>
        <ul className="mt-6 flex flex-col gap-3">
          {planned.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brass-400" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8 border-t border-linen pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 transition-colors hover:text-forest-900"
          >
            Back to dashboard
            <Icon name="arrow-right" className="size-4" />
          </Link>
        </div>
      </Card>
    </>
  );
}
