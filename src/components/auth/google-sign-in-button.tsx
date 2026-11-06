"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Starts Google sign-in. Better Auth creates the OAuth state on the server,
 * then the browser leaves for Google. Google returns to /api/auth/callback/google,
 * which sets the session cookie and redirects to the dashboard, or to /sign-in
 * with an error code.
 *
 * `disabled` is decided on the server (sign-in not configured). This component
 * never sees configuration values.
 */
export function GoogleSignInButton({ disabled, describedBy }: { disabled: boolean; describedBy?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If someone comes back from Google with the Back button, the page may be
  // restored from the back/forward cache with the button still pending.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function signIn() {
    setPending(true);
    setError(null);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/sign-in",
      });
      if (result.error) {
        setError("Google sign-in couldn't start. Please try again.");
        setPending(false);
      }
      // On success the browser is already navigating to Google, so stay pending.
    } catch {
      setError("Google sign-in couldn't start. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={signIn}
        disabled={disabled || pending}
        aria-describedby={describedBy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forest-800 px-5 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-900 disabled:cursor-not-allowed disabled:bg-linen disabled:text-muted sm:w-auto"
      >
        {pending ? "Redirecting to Google…" : "Continue with Google"}
      </button>
      <p role="alert" className="text-sm text-brass-700 empty:hidden">
        {error}
      </p>
    </div>
  );
}
