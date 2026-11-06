/**
 * FICTIONAL DEMONSTRATION DATA.
 *
 * Every record below is invented for UI development. Names use the "Example"
 * surname so they cannot be mistaken for real customers. There is
 * intentionally no pricing or revenue data.
 * Remove this file once real inquiries are stored in the database.
 */

export type InquirySource = "Email" | "Web form" | "Manual";

export type PipelineStage = "new" | "needs-details" | "quoting" | "awaiting-client" | "confirmed";

export type DemoInquiry = {
  id: string;
  eventName: string;
  contactName: string;
  source: InquirySource;
  stage: PipelineStage;
  /** ISO date (YYYY-MM-DD) of the requested event. */
  eventDate: string;
  guestCount: number;
  /** Short note describing what is outstanding, as staff would see it. */
  note: string;
};

export const pipelineStages: { id: PipelineStage; label: string; description: string }[] = [
  { id: "new", label: "New", description: "Received, not yet reviewed" },
  { id: "needs-details", label: "Needs details", description: "Missing information from the client" },
  { id: "quoting", label: "Quoting", description: "Quote being prepared" },
  { id: "awaiting-client", label: "Awaiting client", description: "Quote sent, waiting on a reply" },
  { id: "confirmed", label: "Confirmed", description: "Booked event" },
];

export const demoInquiries: DemoInquiry[] = [
  {
    id: "demo-101",
    eventName: "Spring Board Retreat",
    contactName: "Avery Example",
    source: "Email",
    stage: "new",
    eventDate: "2027-03-18",
    guestCount: 24,
    note: "Asked about vegetarian lunch options",
  },
  {
    id: "demo-102",
    eventName: "Garden Rehearsal Dinner",
    contactName: "Jordan Example",
    source: "Web form",
    stage: "new",
    eventDate: "2027-05-08",
    guestCount: 40,
    note: "Family-style service requested",
  },
  {
    id: "demo-103",
    eventName: "Product Launch Reception",
    contactName: "Riley Example",
    source: "Email",
    stage: "needs-details",
    eventDate: "2027-02-11",
    guestCount: 75,
    note: "Venue address and start time missing",
  },
  {
    id: "demo-104",
    eventName: "Quarterly Team Lunch",
    contactName: "Morgan Example",
    source: "Manual",
    stage: "needs-details",
    eventDate: "2027-01-22",
    guestCount: 18,
    note: "Confirm dietary restrictions",
  },
  {
    id: "demo-105",
    eventName: "Anniversary Brunch",
    contactName: "Casey Example",
    source: "Web form",
    stage: "quoting",
    eventDate: "2027-04-04",
    guestCount: 32,
    note: "Brunch menu selections received",
  },
  {
    id: "demo-106",
    eventName: "Nonprofit Volunteer Thank-You",
    contactName: "Quinn Example",
    source: "Email",
    stage: "awaiting-client",
    eventDate: "2027-02-27",
    guestCount: 60,
    note: "Quote sent; client reviewing",
  },
  {
    id: "demo-107",
    eventName: "Holiday Office Party",
    contactName: "Taylor Example",
    source: "Manual",
    stage: "confirmed",
    eventDate: "2026-12-17",
    guestCount: 50,
    note: "Final headcount due one week prior",
  },
  {
    id: "demo-108",
    eventName: "Book Club Supper",
    contactName: "Sam Example",
    source: "Email",
    stage: "confirmed",
    eventDate: "2027-01-09",
    guestCount: 12,
    note: "Plated dinner, two courses",
  },
];

export function inquiriesInStage(stage: PipelineStage): DemoInquiry[] {
  return demoInquiries.filter((inquiry) => inquiry.stage === stage);
}
