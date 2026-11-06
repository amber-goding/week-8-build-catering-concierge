import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Quotes" };

export default function QuotesPage() {
  return (
    <ModulePlaceholder
      title="Quotes"
      description="Prepare consistent quotes from your own menu and pricing rules."
      planned={[
        "Deterministic quote calculation from menu items, guest counts, and fees you define",
        "Line-item review and adjustment before anything is sent",
        "Quote versions tracked against each inquiry",
        "Exportable quote documents",
      ]}
    />
  );
}
