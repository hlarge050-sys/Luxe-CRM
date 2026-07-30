import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { signOut } from "@/lib/session-actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const ok = await verifySessionToken(token).catch(() => false);
  if (!ok) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-[#101010]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Luxe Landscaping"
              width={28}
              height={28}
              priority
            />
            <span className="text-[15px] font-bold tracking-tight text-white">
              Luxe CRM
            </span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
        <div className="h-[3px] bg-[#8EC63D]" />
      </header>

      <nav className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-5 px-5">
          <Link
            href="/"
            className="py-2.5 text-sm font-medium text-[#2C2C2A] transition hover:text-[#101010]"
          >
            Overview
          </Link>
          <Link
            href="/data"
            className="py-2.5 text-sm font-medium text-[#2C2C2A] transition hover:text-[#101010]"
          >
            Data
          </Link>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        {children}
      </main>

      <footer className="border-t border-neutral-200 py-6 text-center text-[11px] text-neutral-400">
        Luxe Landscaping Limited | Co. No. 14902951 | Internal
      </footer>
    </div>
  );
}
