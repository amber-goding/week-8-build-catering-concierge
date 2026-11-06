import Link from "next/link";
import { PageHeader } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <PageHeader
        eyebrow="404"
        title="Page not found"
        description="This page doesn't exist. Use the navigation to return to an available section."
      />
      <Link href="/" className="text-sm font-medium text-forest-700 hover:text-forest-900">
        Back to dashboard
      </Link>
    </>
  );
}
