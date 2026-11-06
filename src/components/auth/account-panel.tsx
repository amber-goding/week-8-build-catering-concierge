import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAccountState, type RestaurantState } from "@/lib/account-state";

/**
 * Account panel for the dark sidebar and mobile drawer. It reads the session
 * at request time, so it streams in behind its own Suspense boundary while the
 * rest of the shell stays static.
 */
export function AccountPanel() {
  return (
    <section aria-label="Account" className="rounded-lg border border-forest-700 bg-forest-800/60 px-3 py-3">
      <Suspense
        fallback={
          <p className="text-xs text-forest-200" role="status">
            Checking sign-in…
          </p>
        }
      >
        <AccountPanelContent />
      </Suspense>
    </section>
  );
}

async function AccountPanelContent() {
  const state = await getAccountState();

  switch (state.kind) {
    case "setup-required":
      return (
        <div className="flex flex-col gap-1 text-xs leading-snug">
          <p className="font-semibold text-ivory">Sign-in not set up</p>
          <p className="text-forest-100">Google sign-in needs configuration before it can be used.</p>
          <Link href="/sign-in" className="mt-1 self-start font-medium text-brass-400 underline underline-offset-2 hover:text-brass-100">
            Setup details
          </Link>
        </div>
      );

    case "unavailable":
      return (
        <div className="flex flex-col gap-1 text-xs leading-snug">
          <p className="font-semibold text-ivory">Sign-in status unavailable</p>
          <p className="text-forest-100">The account service couldn&apos;t be reached. Try again shortly.</p>
        </div>
      );

    case "signed-out":
      return (
        <div className="flex flex-col gap-2 text-xs leading-snug">
          <p className="text-forest-100">Not signed in. The dashboard and planned pages are viewable without an account.</p>
          <Link
            href="/sign-in"
            className="rounded-lg bg-ivory px-3 py-2 text-center text-sm font-semibold text-forest-900 transition-colors hover:bg-cream"
          >
            Sign in
          </Link>
        </div>
      );

    case "signed-in":
      return (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-forest-200">Signed in with Google</p>
            <div className="mt-2 flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-forest-700 text-xs font-semibold text-ivory"
              >
                {initials(state.user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ivory" title={state.user.name}>
                  {state.user.name}
                </p>
                <p className="truncate text-xs text-forest-200" title={state.user.email}>
                  {state.user.email}
                </p>
              </div>
            </div>
          </div>
          <RestaurantSummary state={state.restaurant} />
          <p className="text-[11px] leading-snug text-forest-200">
            Your account and restaurant are real. The inquiries shown are fictional samples.
          </p>
          <SignOutButton tone="dark" />
        </div>
      );
  }
}

/** The signed-in user's restaurant, shown only to its member, or a link to set one up. */
function RestaurantSummary({ state }: { state: RestaurantState }) {
  switch (state.kind) {
    case "member":
      return (
        <div className="border-t border-forest-700 pt-3 text-xs leading-snug">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forest-200">Your restaurant</p>
          <p className="mt-1 break-words text-sm font-medium text-ivory">{state.restaurant.name}</p>
        </div>
      );
    case "needs-setup":
      return (
        <div className="flex flex-col gap-1.5 border-t border-forest-700 pt-3 text-xs leading-snug">
          <p className="text-forest-100">No restaurant set up yet.</p>
          <Link
            href="/setup"
            className="rounded-lg bg-ivory px-3 py-2 text-center text-sm font-semibold text-forest-900 transition-colors hover:bg-cream"
          >
            Set up your restaurant
          </Link>
        </div>
      );
    case "unavailable":
      return (
        <p className="border-t border-forest-700 pt-3 text-xs leading-snug text-forest-100">
          Restaurant status is unavailable right now. Try again shortly.
        </p>
      );
  }
}

/** Up to two initials from a display name, for the decorative avatar. */
function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return letters || "?";
}
