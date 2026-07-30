// Contacts as the Pipedrive People table: name, email chip, phone link,
// address, jobs count. Scrolls sideways on the phone like their tables do.
import Link from "next/link";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

const th =
  "whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500";
const td = "border-t border-neutral-100 px-3 py-2.5 align-middle";

export default async function ContactsPage() {
  let rows: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    addressLine1: string | null;
    town: string | null;
    postcode: string | null;
    jobs: { id: number }[];
  }[] = [];
  let dbDown = false;

  try {
    const db = getDb();
    rows = await db.query.contacts.findMany({
      columns: {
        id: true,
        name: true,
        phone: true,
        email: true,
        addressLine1: true,
        town: true,
        postcode: true,
      },
      with: { jobs: { columns: { id: true } } },
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  } catch {
    dbDown = true;
  }

  if (dbDown) {
    return (
      <p className="mx-auto mt-8 max-w-xl rounded-md border border-neutral-200 bg-white p-5 text-sm">
        The database is not reachable. Deploys run migrations automatically,
        so check the latest deployment log on Vercel.
      </p>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-neutral-500">
          {rows.length} {rows.length === 1 ? "person" : "people"}
        </p>
        <Link
          href="/jobs/new"
          className="rounded-md bg-[#8EC63D] px-3.5 py-2 text-sm font-semibold text-[#101010] transition hover:brightness-95"
        >
          New enquiry
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No contacts yet. The first enquiry creates the first contact.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Email</th>
                <th className={th}>Phone</th>
                <th className={th}>Address</th>
                <th className={th}>Jobs</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className={`${td} whitespace-nowrap font-semibold text-[#101010]`}>
                    <Link
                      href={`/contacts/${c.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        className="inline-block rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[13px] text-[#3f6b12] hover:border-[#8EC63D]/60"
                      >
                        {c.email}
                      </a>
                    ) : null}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone}`}
                        className="text-[#3f6b12] underline-offset-2 hover:underline"
                      >
                        {c.phone}
                      </a>
                    ) : null}
                  </td>
                  <td className={`${td} text-neutral-500`}>
                    {[c.addressLine1, c.town, c.postcode].filter(Boolean).join(", ")}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                      {c.jobs.length}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
