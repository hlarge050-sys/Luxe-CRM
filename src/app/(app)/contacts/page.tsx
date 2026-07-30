// Contacts list. Names link to the contact, phone numbers dial straight from
// the row on a phone.
import Link from "next/link";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  let rows: {
    id: number;
    name: string;
    phone: string | null;
    town: string | null;
    jobs: { id: number }[];
  }[] = [];
  let dbDown = false;

  try {
    const db = getDb();
    rows = await db.query.contacts.findMany({
      columns: { id: true, name: true, phone: true, town: true },
      with: { jobs: { columns: { id: true } } },
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  } catch {
    dbDown = true;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Contacts
      </p>

      {dbDown ? (
        <p className="mt-3 rounded-md border border-neutral-200 border-l-[3px] border-l-[#8EC63D] bg-white p-5 text-sm shadow-sm">
          The database is not reachable. Deploys run migrations automatically,
          so check the latest deployment log on Vercel.
        </p>
      ) : rows.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          No contacts yet. The first enquiry creates the first contact.
          <div className="mt-3">
            <Link
              href="/jobs/new"
              className="inline-block rounded-md bg-[#8EC63D] px-4 py-2 text-sm font-semibold text-[#101010]"
            >
              New enquiry
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 border-l-[3px] border-l-[#8EC63D] bg-white p-3.5 shadow-sm"
            >
              <div className="min-w-0">
                <Link
                  href={`/contacts/${c.id}`}
                  className="text-[15px] font-semibold text-[#101010] underline-offset-2 hover:underline"
                >
                  {c.name}
                </Link>
                <p className="mt-0.5 truncate text-sm text-neutral-500">
                  {c.phone ? (
                    <a
                      href={`tel:${c.phone}`}
                      className="text-[#3f6b12] underline-offset-2 hover:underline"
                    >
                      {c.phone}
                    </a>
                  ) : null}
                  {c.phone && c.town ? " | " : ""}
                  {c.town ?? ""}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                {c.jobs.length} {c.jobs.length === 1 ? "job" : "jobs"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
