import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Settings"
      description="Configure the restaurant profile, team access, and integrations."
      planned={[
        "Restaurant profile and contact details",
        "Team members and roles",
        "Integration connections such as Gmail",
        "Notification preferences",
      ]}
    />
  );
}
