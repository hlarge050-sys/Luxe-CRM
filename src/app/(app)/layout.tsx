// The app shell, restructured to the Pipedrive pattern from Hazz's
// screenshots: dark icon rail on the left, white top bar with the global
// search, bottom bar on the phone. Auth guard stays here.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { Rail } from "@/components/shell/rail";
import { TopBar } from "@/components/shell/topbar";
import { BottomNav } from "@/components/shell/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const ok = await verifySessionToken(token).catch(() => false);
  if (!ok) redirect("/login");

  return (
    <div className="min-h-dvh">
      <Rail />
      <div className="flex min-h-dvh flex-col sm:pl-16">
        <TopBar />
        <main className="w-full flex-1 pb-20 sm:pb-0">{children}</main>
        <footer className="hidden border-t border-neutral-200 py-5 text-center text-[11px] text-neutral-400 sm:block">
          Luxe Landscaping Limited | Co. No. 14902951 | Internal
        </footer>
      </div>
      <BottomNav />
    </div>
  );
}
