import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Menu" };

export default function MenuPage() {
  return (
    <ModulePlaceholder
      title="Menu"
      description="Maintain the catering menu that quotes and replies are built from."
      planned={[
        "Catering items, packages, and serving styles",
        "Dietary and allergen labeling",
        "Per-guest and per-item pricing rules entered by the restaurant",
        "Availability and minimum order settings",
      ]}
    />
  );
}
