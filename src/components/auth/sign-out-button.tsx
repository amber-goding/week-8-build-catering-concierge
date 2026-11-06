"use client";

import { useRouter } from "next/navigation";
import { useActionState, useRef } from "react";
import { signOutAction, type SignOutResult } from "@/lib/auth-actions";

const tones = {
  dark: "border border-forest-600 text-forest-100 hover:bg-forest-800 hover:text-ivory",
  light: "border border-sand bg-white text-forest-800 hover:bg-cream",
};

/**
 * Sign-out form. The Server Action ends the session; on success this goes to
 * /sign-in, where the page and the account panel show the signed-out state.
 *
 * In the mobile drawer, a successful sign-out also closes the drawer (the
 * <dialog> this form sits in) so the resulting page is visible, even when
 * already on /sign-in. Closing a modal dialog returns focus to the menu button
 * that opened it. If sign-out fails, the drawer stays open with the error shown.
 */
export function SignOutButton({ tone, className = "" }: { tone: keyof typeof tones; className?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction, pending] = useActionState<SignOutResult | null>(async () => {
    const outcome = await signOutAction();
    if (outcome.ok) {
      formRef.current?.closest("dialog")?.close();
      router.replace("/sign-in?signed_out=1");
    }
    return outcome;
  }, null);

  return (
    <form ref={formRef} action={formAction} className={`flex flex-col gap-2 ${className}`}>
      <button
        type="submit"
        disabled={pending}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-80 ${tones[tone]}`}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      <p role="alert" className={`text-xs empty:hidden ${tone === "dark" ? "text-brass-100" : "text-brass-700"}`}>
        {result && !result.ok ? result.error : null}
      </p>
    </form>
  );
}
