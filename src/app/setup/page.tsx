import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RestaurantSetupForm } from "@/components/restaurant/restaurant-setup-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { getAccountState } from "@/lib/account-state";
import { RESTAURANT_NAME_MAX_LENGTH } from "@/lib/restaurants";

export const metadata: Metadata = { title: "Restaurant setup" };

export default function SetupPage() {
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Restaurant setup"
        description="Name the restaurant your account belongs to. You become its owner. Inquiry data in the app is still fictional."
        badge={<Badge tone="forest">One restaurant per account</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 sm:p-8 lg:col-span-3">
          <Suspense fallback={<p role="status" className="text-sm text-muted">Checking your account…</p>}>
            <SetupPanel />
          </Suspense>
        </Card>

        <aside aria-labelledby="setup-scope-heading" className="lg:col-span-2">
          <Card className="p-6">
            <h2 id="setup-scope-heading" className="font-display text-lg font-medium text-forest-900">
              What setup does today
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-ink">
              {scope.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brass-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}

const scope = [
  "Saves your restaurant's name and makes you its owner.",
  "Each account belongs to one restaurant. Invitations, staff roles, and switching restaurants aren't built.",
  "Doesn't change the dashboard. The inquiries shown are still fictional samples.",
  "Renaming and other restaurant settings are planned for the Settings module.",
];

/** Reads the session and membership at request time, so it streams in behind Suspense. */
async function SetupPanel() {
  const state = await getAccountState();

  switch (state.kind) {
    case "setup-required":
      return (
        <Notice title="Sign-in isn't set up">
          Google sign-in isn&apos;t configured on this server, so restaurant setup isn&apos;t available.{" "}
          <Link href="/sign-in" className="font-medium underline underline-offset-2">
            Setup details
          </Link>
        </Notice>
      );
    case "unavailable":
      return (
        <Notice title="Account status unavailable">
          The account service couldn&apos;t be reached. Try again shortly.
        </Notice>
      );
    case "signed-out":
      return (
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-medium text-forest-900">Sign in first</h2>
          <p className="text-sm text-muted">Restaurant setup needs a signed-in account.</p>
          <Link
            href="/sign-in"
            className="self-start rounded-lg bg-forest-800 px-4 py-2 text-sm font-medium text-ivory transition-colors hover:bg-forest-900"
          >
            Sign in
          </Link>
        </div>
      );
    case "signed-in":
      // Fail closed: while membership is unknown, offer neither the form nor a restaurant.
      if (state.restaurant.kind === "unavailable") {
        return (
          <Notice title="Restaurant status unavailable">
            Your restaurant couldn&apos;t be checked right now, so setup is paused. Try again shortly.
          </Notice>
        );
      }
      return (
        <RestaurantSetupForm
          restaurantName={state.restaurant.kind === "member" ? state.restaurant.restaurant.name : null}
          maxLength={RESTAURANT_NAME_MAX_LENGTH}
        />
      );
  }
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-brass-100 bg-brass-50 px-4 py-3 text-sm text-brass-700">
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}
