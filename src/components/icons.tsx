import type { NavIconName } from "@/lib/navigation";

type IconName = NavIconName | "close" | "hamburger" | "flask" | "arrow-right";

/** Stroke paths drawn on a 24×24 grid. Kept inline to avoid an icon dependency. */
const paths: Record<IconName, string[]> = {
  dashboard: ["M4 4h7v7H4z", "M13 4h7v4h-7z", "M13 10h7v10h-7z", "M4 13h7v7H4z"],
  inquiries: ["M4 5h16v11H8l-4 4z", "M8 9h8", "M8 12h5"],
  email: ["M3 6h18v12H3z", "m3 7 9 6 9-6"],
  menu: ["M7 3v8a2 2 0 0 0 4 0V3", "M9 11v10", "M17 3c-2 2-2 6 0 8v10"],
  quotes: ["M6 3h9l3 3v15H6z", "M9 9h6", "M9 13h6", "M9 17h4"],
  events: ["M4 6h16v14H4z", "M4 10h16", "M8 3v5", "M16 3v5"],
  settings: [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  ],
  close: ["M6 6l12 12", "M18 6 6 18"],
  hamburger: ["M4 7h16", "M4 12h16", "M4 17h16"],
  flask: ["M9 3h6", "M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3", "M7.5 15h9"],
  "arrow-right": ["M5 12h14", "m13 6 6 6-6 6"],
};

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
