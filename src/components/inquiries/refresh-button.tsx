"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Re-renders the Inquiries page on the server (router.refresh()), so newly
 * imported inquiries appear without a full reload. A live region announces
 * the progress and result.
 */
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refreshed, setRefreshed] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          setRefreshed(true);
          startTransition(() => router.refresh());
        }}
        disabled={pending}
        className="rounded-lg border border-sand bg-white px-4 py-2 text-sm font-medium text-forest-800 transition-colors hover:bg-cream disabled:cursor-wait disabled:opacity-80"
      >
        {pending ? "Refreshing…" : "Refresh"}
      </button>
      <p aria-live="polite" className="text-xs text-muted">
        {pending ? "Checking for new inquiries…" : refreshed ? "List refreshed." : ""}
      </p>
    </div>
  );
}
