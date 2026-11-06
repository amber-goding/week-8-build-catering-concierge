import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Email" };

export default function EmailPage() {
  return (
    <ModulePlaceholder
      title="Email"
      description="Connect a restaurant inbox so catering requests are captured automatically."
      planned={[
        "Gmail connection through OAuth, with read access limited to what is needed",
        "Detection of likely catering inquiries among incoming messages",
        "Drafted replies that staff review and send themselves",
        "Conversation history linked to each inquiry",
      ]}
    />
  );
}
