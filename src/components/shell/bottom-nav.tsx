"use client";

// The phone counterpart of the rail: a fixed bottom bar, the pattern the
// Pipedrive mobile app uses. Hidden once the rail takes over on wider
// screens.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoardIcon, PeopleIcon, TableIcon } from "@/components/icons";
import { isActive } from "./rail";

const items = [
  { href: "/", label: "Board", icon: BoardIcon, match: ["/", "/jobs"] },
  { href: "/contacts", label: "Contacts", icon: PeopleIcon, match: ["/contacts"] },
  { href: "/data", label: "Data", icon: TableIcon, match: ["/data"] },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="grid grid-cols-3">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = isActive(pathname, match);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                active ? "text-[#3f6b12]" : "text-neutral-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
