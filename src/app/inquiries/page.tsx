import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { InquiryReviewCard } from "@/components/inquiries/inquiry-review-card";
import { RefreshButton } from "@/components/inquiries/refresh-button";
import { Badge, Card, PageHeader } from "@/components/ui";
import { getPrisma } from "@/lib/db";
import { INQUIRY_LIST_LIMIT, listInquiriesForRestaurant, type InquiryReview } from "@/lib/inquiries";
import { requireRestaurant } from "@/lib/restaurant-access";
import type { MemberRestaurant } from "@/lib/restaurants";
import { describeErrorSafely } from "@/lib/restaurants";

export const metadata: Metadata = { title: "Inquiries" };

export default function InquiriesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Inquiries"
        title="Imported inquiries"
        description="Inquiries imported for your restaurant through the Zapier pilot, each with the AI review that came with it. This page is for reading only: nothing can be approved, sent, edited, or quoted here yet."
        badge={<Badge tone="forest">Limited pilot</Badge>}
      />
      <Suspense fallback={<p role="status" className="text-sm text-muted">Loading inquiries…</p>}>
        <InquiryList />
      </Suspense>
    </>
  );
}

/**
 * Restaurant scope comes only from requireRestaurant(): signed-out visitors go
 * to /sign-in and users without a restaurant go to /setup. Any failure shows an
 * "unavailable" notice instead of data (fail closed).
 */
async function InquiryList() {
  let restaurant: MemberRestaurant;
  let inquiries: InquiryReview[];
  try {
    ({ restaurant } = await requireRestaurant());
    inquiries = await listInquiriesForRestaurant(getPrisma(), restaurant.id);
  } catch (error) {
    unstable_rethrow(error); // Let requireRestaurant()'s redirects through.
    console.error(`[inquiries] Could not load inquiries: ${describeErrorSafely(error)}`);
    return (
      <Card className="max-w-2xl p-6">
        <p className="font-semibold text-forest-900">Inquiries are unavailable right now</p>
        <p className="mt-1 text-sm text-muted">They couldn&apos;t be loaded. Try again shortly.</p>
      </Card>
    );
  }

  return (
    <section aria-labelledby="inquiry-list-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="inquiry-list-heading" className="font-display text-xl font-medium text-forest-900">
            For {restaurant.name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {inquiries.length === 0
              ? "No inquiries yet."
              : `${inquiries.length} ${inquiries.length === 1 ? "inquiry" : "inquiries"}, newest first${
                  inquiries.length === INQUIRY_LIST_LIMIT ? ` (only the latest ${INQUIRY_LIST_LIMIT} are shown)` : ""
                }.`}
          </p>
        </div>
        <RefreshButton />
      </div>

      {inquiries.length === 0 ? (
        <Card className="max-w-2xl p-6 sm:p-8">
          <h3 className="font-display text-lg font-medium text-forest-900">Nothing imported yet</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Inquiries appear here once the Zapier pilot sends them to this restaurant. Use Refresh to check again. The{" "}
            <Link href="/" className="font-medium text-forest-700 underline underline-offset-2 hover:text-forest-900">
              dashboard
            </Link>{" "}
            shows a separate, fictional pipeline preview.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-5">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <InquiryReviewCard inquiry={inquiry} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
