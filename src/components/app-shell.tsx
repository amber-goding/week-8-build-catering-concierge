import { Brand } from "@/components/brand";
import { DemoBanner, DemoPill } from "@/components/demo-mode";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ivory focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-forest-900 focus:shadow-lg"
      >
        Skip to content
      </a>

      <aside data-surface="dark" className="sticky top-0 hidden h-dvh flex-col gap-10 bg-forest-900 px-4 py-6 lg:flex">
        <Brand />
        <NavLinks />
        <DemoPill />
      </aside>

      <div className="flex min-w-0 flex-col">
        <MobileNav />
        <DemoBanner />
        <main id="main" tabIndex={-1} className="flex-1 px-5 py-8 outline-none sm:px-8 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
