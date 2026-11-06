import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge, Card, PageHeader } from "@/components/ui";
import { getAccountState } from "@/lib/account-state";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Sign in"
        description="Sign in with your Google account. Signing in confirms who you are, and lets you set up your restaurant. Inquiry data is still fictional."
        badge={<Badge tone="forest">Google only</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 sm:p-8 lg:col-span-3">
          <Suspense fallback={<p role="status" className="text-sm text-muted">Checking sign-in status…</p>}>
            <SignInPanel searchParams={searchParams} />
          </Suspense>
        </Card>

        <aside aria-labelledby="sign-in-scope-heading" className="lg:col-span-2">
          <Card className="p-6">
            <h2 id="sign-in-scope-heading" className="font-display text-lg font-medium text-forest-900">
              What signing in does today
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
  "Confirms your identity with Google. Only your name, email address, and profile are requested.",
  "Keeps you signed in on this browser for up to 7 days, or until you sign out.",
  "Doesn't connect Gmail or read your email.",
  "Lets you set up one restaurant, which you then own, and read its imported pilot inquiries (fictional demonstration records). The dashboard stays fictional sample data and, like the planned modules, viewable without signing in.",
];

async function SignInPanel({ searchParams }: { searchParams: PageProps<"/sign-in">["searchParams"] }) {
  const [state, params] = await Promise.all([getAccountState(), searchParams]);
  const errorMessage = describeSignInError(firstValue(params.error));
  const signedOut = firstValue(params.signed_out) === "1";

  if (state.kind === "signed-in") {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="font-display text-xl font-medium text-forest-900">You&apos;re signed in</h2>
          <p className="mt-2 text-sm text-muted">
            Signed in with Google as <strong className="font-semibold text-ink">{state.user.name}</strong> (
            <span className="break-all">{state.user.email}</span>). This is your real account. The inquiry data in this
            app is still fictional.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <Link
            href="/"
            className="rounded-lg bg-forest-800 px-4 py-2 text-sm font-medium text-ivory transition-colors hover:bg-forest-900"
          >
            Go to dashboard
          </Link>
          <SignOutButton tone="light" />
        </div>
      </div>
    );
  }

  const setupRequired = state.kind === "setup-required";
  const unavailable = state.kind === "unavailable";

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl font-medium text-forest-900">Continue with Google</h2>

      {signedOut && !errorMessage && (
        <p role="status" className="rounded-lg border border-forest-100 bg-forest-50 px-4 py-3 text-sm text-forest-700">
          You&apos;ve signed out.
        </p>
      )}

      {errorMessage && (
        <p role="alert" className="rounded-lg border border-brass-100 bg-brass-50 px-4 py-3 text-sm text-brass-700">
          {errorMessage}
        </p>
      )}

      {setupRequired && (
        <div
          id="sign-in-setup"
          className="rounded-lg border border-brass-100 bg-brass-50 px-4 py-3 text-sm text-brass-700"
        >
          <p className="font-semibold">Setup required</p>
          <p className="mt-1">
            Google sign-in isn&apos;t configured on this server, so the button below is disabled. The README&apos;s
            &ldquo;Authentication setup&rdquo; section lists the steps.
          </p>
          {state.problems.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {state.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {unavailable && (
        <p id="sign-in-unavailable" className="rounded-lg border border-brass-100 bg-brass-50 px-4 py-3 text-sm text-brass-700">
          The account service couldn&apos;t be reached, so sign-in is unavailable right now. Try again shortly.
        </p>
      )}

      <GoogleSignInButton
        disabled={setupRequired || unavailable}
        describedBy={setupRequired ? "sign-in-setup" : unavailable ? "sign-in-unavailable" : undefined}
      />
    </div>
  );
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Maps the `error` code Better Auth adds to /sign-in after a failed Google
 * sign-in to fixed text. The raw query value is never displayed.
 */
function describeSignInError(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "access_denied") return "Google sign-in was cancelled. You can try again.";
  if (/state|restart|invalid_callback_request/.test(code)) {
    return "That sign-in attempt expired or couldn't be verified. Please start again.";
  }
  return "Google sign-in couldn't be completed. Please try again.";
}
