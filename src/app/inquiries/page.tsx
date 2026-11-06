import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Inquiries" };

export default function InquiriesPage() {
  return (
    <ModulePlaceholder
      title="Inquiries"
      description="Every catering request in one place, from first contact to a confirmed event."
      planned={[
        "A single list of inquiries from connected email, web forms, and manual entry",
        "AI-assisted extraction of event date, guest count, venue, and dietary needs, with staff review",
        "Pipeline stages with clear ownership and follow-up reminders",
        "Flags for missing details before a quote can be prepared",
      ]}
    />
  );
}
