"use client";

import { useEffect, useRef } from "react";
import { Brand } from "@/components/brand";
import { DemoPill } from "@/components/demo-mode";
import { Icon } from "@/components/icons";
import { NavLinks } from "@/components/nav-links";

/**
 * Mobile top bar with a navigation drawer pinned to the left edge.
 * The drawer appears and disappears instantly (no animation).
 * Uses a native modal <dialog>, which provides focus containment,
 * Escape-to-close, and an inert background without extra dependencies.
 */
export function MobileNav() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  // The drawer is hidden at the lg breakpoint; close it so the page never
  // stays inert behind an invisible modal after a resize.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) dialogRef.current?.close();
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  return (
    <header data-surface="dark" className="sticky top-0 z-30 flex items-center gap-2 bg-forest-900 px-4 py-3 lg:hidden">
      {/* Menu button sits on the left, next to the drawer it opens. -ml-2 aligns the icon glyph with the page gutter. */}
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-controls="mobile-nav"
        className="-ml-2 grid size-10 shrink-0 place-items-center rounded-lg text-ivory transition-colors hover:bg-forest-800"
      >
        <Icon name="hamburger" className="size-6" />
        <span className="sr-only">Open navigation</span>
      </button>
      <Brand />

      <dialog
        id="mobile-nav"
        ref={dialogRef}
        aria-label="Navigation"
        onClick={(event) => {
          // A click on the backdrop targets the dialog element itself.
          if (event.target === event.currentTarget) close();
        }}
        className="m-0 h-dvh max-h-none w-80 max-w-[85vw] bg-forest-900 p-0 text-ivory backdrop:bg-forest-900/60 lg:hidden"
      >
        <div className="flex h-full flex-col gap-8 px-4 py-4">
          <div className="flex items-center justify-between">
            <Brand onNavigate={close} />
            <button
              type="button"
              onClick={close}
              className="grid size-10 place-items-center rounded-lg text-ivory transition-colors hover:bg-forest-800"
            >
              <Icon name="close" className="size-6" />
              <span className="sr-only">Close navigation</span>
            </button>
          </div>
          <NavLinks onNavigate={close} />
          <DemoPill />
        </div>
      </dialog>
    </header>
  );
}
