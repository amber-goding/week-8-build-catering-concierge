"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createRestaurantAction } from "@/lib/restaurant-actions";
import type { RestaurantSetupState } from "@/lib/restaurants";

const initialState: RestaurantSetupState = { status: "idle" };

/**
 * Restaurant setup form, or the user's existing restaurant once they have one.
 *
 * `restaurantName` comes from the server, from the session user's membership.
 * The form sends only a name. The server decides who the owner is.
 *
 * After a successful save, the action re-renders the page, and this component
 * receives the new name while keeping its state. It then shows a status message
 * and moves focus to the result, because the form it replaces is gone.
 */
export function RestaurantSetupForm({ restaurantName, maxLength }: { restaurantName: string | null; maxLength: number }) {
  const [state, formAction, pending] = useActionState(createRestaurantAction, initialState);
  const [name, setName] = useState("");
  const resultRef = useRef<HTMLHeadingElement>(null);
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  const saved = state.status === "created" || state.status === "exists";
  useEffect(() => {
    if (restaurantName && saved) resultRef.current?.focus();
  }, [restaurantName, saved]);

  if (restaurantName) {
    return (
      <div className="flex flex-col gap-4">
        {saved && (
          <p role="status" className="rounded-lg border border-forest-100 bg-forest-50 px-4 py-3 text-sm text-forest-700">
            {state.status === "created"
              ? "Restaurant saved. You're its owner."
              : "This account already has a restaurant, so nothing new was created."}
          </p>
        )}
        <h2 ref={resultRef} tabIndex={-1} className="font-display text-xl font-medium text-forest-900">
          Your restaurant
        </h2>
        <p className="break-words text-lg font-medium text-ink">{restaurantName}</p>
        <p className="text-sm text-muted">
          You&apos;re its owner. Renaming and other restaurant settings aren&apos;t available yet.
        </p>
        <Link
          href="/"
          className="self-start rounded-lg bg-forest-800 px-4 py-2 text-sm font-medium text-ivory transition-colors hover:bg-forest-900"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  const message = state.status === "invalid" || state.status === "error" || state.status === "unauthenticated" ? state.message : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <h2 className="font-display text-xl font-medium text-forest-900">Name your restaurant</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          Restaurant name
        </label>
        <input
          id={inputId}
          name="name"
          type="text"
          required
          maxLength={maxLength}
          autoComplete="organization"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-describedby={message ? `${hintId} ${errorId}` : hintId}
          aria-invalid={state.status === "invalid" || undefined}
          className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-600 aria-invalid:border-brass-600"
        />
        <p id={hintId} className="text-xs text-muted">
          Up to {maxLength} characters. You&apos;ll be the restaurant&apos;s owner, and each account can have one restaurant.
        </p>
      </div>

      <div id={errorId} role="alert" className="empty:hidden">
        {message && (
          <p className="rounded-lg border border-brass-100 bg-brass-50 px-4 py-3 text-sm text-brass-700">
            {message}
            {state.status === "unauthenticated" && (
              <>
                {" "}
                <Link href="/sign-in" className="font-medium underline underline-offset-2">
                  Go to sign-in
                </Link>
              </>
            )}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-forest-800 px-5 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-900 disabled:cursor-wait disabled:opacity-80"
      >
        {pending ? "Saving…" : "Save restaurant"}
      </button>
    </form>
  );
}
