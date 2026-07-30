"use client";

// The white top bar from the Pipedrive shell: section title on the left, the
// search front and centre, quick add on the right.

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { PlusIcon, SearchIcon } from "@/components/icons";

function titleFor(pathname: string): string {
  if (pathname === "/") return "Jobs";
  if (pathname === "/jobs/new") return "New enquiry";
  if (pathname.startsWith("/jobs/")) return "Job";
  if (pathname === "/contacts") return "Contacts";
  if (pathname.startsWith("/contacts/")) return "Contact";
  if (pathname === "/data") return "Data";
  if (pathname === "/search") return "Search";
  return "Luxe CRM";
}

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    const term = typeof q === "string" ? q.trim() : "";
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link href="/" className="sm:hidden" aria-label="Luxe CRM home">
          <Image src="/logo.png" alt="Luxe Landscaping" width={28} height={28} priority />
        </Link>
        <h1 className="hidden min-w-24 text-[17px] font-bold tracking-tight text-[#101010] sm:block">
          {titleFor(pathname)}
        </h1>

        <form
          onSubmit={submitSearch}
          className="mx-auto flex w-full max-w-md flex-1 items-center gap-2 rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 focus-within:border-[#8EC63D]"
        >
          <SearchIcon className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            name="q"
            type="search"
            placeholder="Search Luxe CRM"
            aria-label="Search jobs and contacts"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-neutral-400"
          />
        </form>

        <Link
          href="/jobs/new"
          aria-label="New enquiry"
          title="New enquiry"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8EC63D] text-[#101010] transition hover:brightness-95"
        >
          <PlusIcon className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
