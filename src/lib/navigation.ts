/**
 * Primary navigation for the app shell.
 *
 * `status` describes whether the module behind a route has real functionality:
 * - "preview": the page renders, using fictional demonstration data only.
 * - "limited": part of the module works for real, within a narrow scope
 *   (Inquiries: reading Zapier pilot imports for your own restaurant).
 * - "planned": the route exists but the module has not been built yet.
 * Update a module's status here when its functionality actually ships.
 */
export type ModuleStatus = "preview" | "limited" | "planned";

/** How each status is labelled in the nav and the dashboard's module list. */
export const moduleStatusLabel: Record<ModuleStatus, string> = {
  preview: "Preview",
  limited: "Limited",
  planned: "Planned",
};

export type NavItem = {
  href: string;
  label: string;
  status: ModuleStatus;
  icon: NavIconName;
};

export type NavIconName =
  | "dashboard"
  | "inquiries"
  | "email"
  | "menu"
  | "quotes"
  | "events"
  | "settings";

export const primaryNav: NavItem[] = [
  { href: "/", label: "Dashboard", status: "preview", icon: "dashboard" },
  { href: "/inquiries", label: "Inquiries", status: "limited", icon: "inquiries" },
  { href: "/email", label: "Email", status: "planned", icon: "email" },
  { href: "/menu", label: "Menu", status: "planned", icon: "menu" },
  { href: "/quotes", label: "Quotes", status: "planned", icon: "quotes" },
  { href: "/events", label: "Events", status: "planned", icon: "events" },
];

export const secondaryNav: NavItem[] = [
  { href: "/settings", label: "Settings", status: "planned", icon: "settings" },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
