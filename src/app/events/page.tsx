import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <ModulePlaceholder
      title="Events"
      description="Track confirmed bookings and what each one needs."
      planned={[
        "Calendar and list views of confirmed events",
        "Final headcount, timing, and delivery or pickup details",
        "Prep notes for the kitchen and front of house",
        "Post-event notes and simple business analytics",
      ]}
    />
  );
}
