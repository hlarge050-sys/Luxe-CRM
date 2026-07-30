"use client";

// The left rail, straight off the Pipedrive shell: dark column of icons with
// the logo up top and sign out at the bottom, in Luxe black with the green
// active tile. Desktop only, the phone gets the bottom bar instead.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/session-actions";
import { BoardIcon, PeopleIcon, SignOutIcon, TableIcon } from "@/components/icons";

const items = [
  { href: "/", label: "Board", icon: BoardIcon, match: ["/", "/jobs"] },
  { href: "/contacts", label: "Contacts", icon: PeopleIcon, match: ["/contacts"] },
  { href: "/data", label: "Data", icon: TableIcon, match: ["/data"] },
];

export function isActive(pathname: string, match: string[]) {
  return match.some((m) =>
    m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(`${m}/`),
  );
}

export function Rail() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col items-center bg-[#101010] py-3 sm:flex">
      <Link href="/" aria-label="Luxe CRM home" className="mb-4">
        <Image src="/logo.png" alt="Luxe Landscaping" width={34} height={34} priority />
      </Link>

      <nav className="flex flex-col items-center gap-2">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = isActive(pathname, match);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                active
                  ? "bg-[#8EC63D] text-[#101010]"
                  : "text-neutral-500 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      <form action={signOut} className="mt-auto">
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white/10 hover:text-white"
        >
          <SignOutIcon className="h-5 w-5" />
        </button>
      </form>
    </aside>
  );
}
