"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { isActivePath, primaryNav, secondaryNav, type NavItem } from "@/lib/navigation";

/**
 * Navigation list shared by the desktop sidebar and the mobile drawer.
 * Every link routes to a real page; modules that are not built yet are
 * marked "Planned" so the nav never implies functionality that doesn't exist.
 */
export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-8">
      <NavGroup items={primaryNav} pathname={pathname} onNavigate={onNavigate} />
      <div className="mt-auto">
        <NavGroup items={secondaryNav} pathname={pathname} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}

function NavGroup({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={[
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-forest-800 text-ivory shadow-sm"
                  : "text-forest-100 hover:bg-forest-800/60 hover:text-ivory",
              ].join(" ")}
            >
              <Icon
                name={item.icon}
                className={[
                  "size-[18px] shrink-0 transition-colors",
                  active ? "text-brass-400" : "text-forest-200 group-hover:text-brass-400",
                ].join(" ")}
              />
              <span className="flex-1">{item.label}</span>
              {item.status === "planned" && (
                <span className="rounded-full border border-forest-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-forest-200">
                  Planned
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
