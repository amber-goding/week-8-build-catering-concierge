import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Restaurant-scoped inquiry reads for the Inquiries page.
 *
 * The restaurant ID must come from requireRestaurant() (the session user's
 * membership), never from the request. Every query here filters by it.
 */

export const INQUIRY_LIST_LIMIT = 50;

/** What the review screen shows. Message and review are untrusted plain text. */
export type InquiryReview = {
  id: string;
  inquiryMessage: string | null;
  aiReview: string | null;
  isDemo: boolean;
  importedFromZapier: boolean;
  receivedAt: Date;
};

export async function listInquiriesForRestaurant(
  db: Pick<PrismaClient, "inquiry">,
  restaurantId: string,
): Promise<InquiryReview[]> {
  const rows = await db.inquiry.findMany({
    where: { restaurantId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: INQUIRY_LIST_LIMIT,
    select: { id: true, inquiryMessage: true, aiReview: true, isDemo: true, zapierRecordId: true, createdAt: true },
  });
  return rows.map((row) => ({
    id: row.id,
    inquiryMessage: row.inquiryMessage,
    aiReview: row.aiReview,
    isDemo: row.isDemo,
    importedFromZapier: row.zapierRecordId !== null,
    receivedAt: row.createdAt,
  }));
}

const receivedFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

/** Deterministic (fixed locale and UTC), so server output never depends on the host's time zone. */
export function formatReceivedAt(date: Date): string {
  return `${receivedFormatter.format(date)} UTC`;
}
