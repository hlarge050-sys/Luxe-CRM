// Global search behind the top bar box: jobs by title, contacts by name,
// phone or email, each section linking straight through.
import Link from "next/link";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

const gbp = new Intl.NumberFormat("en-GB");

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();

  if (!term) {
    return (
      <p className="mx-auto mt-10 max-w-xl px-4 text-center text-sm text-neutral-400">
        Type in the search box above to find jobs and contacts.
      </p>
    );
  }

  const like = `%${term}%`;
  const db = getDb();

  const [jobRows, contactRows] = await Promise.all([
    db.query.jobs.findMany({
      where: (t, { ilike }) => ilike(t.title, like),
      with: {
        contact: { columns: { name: true } },
        stage: { columns: { name: true, isTerminal: true } },
      },
      orderBy: (t, { desc }) => [desc(t.updatedAt)],
      limit: 25,
    }),
    db.query.contacts.findMany({
      where: (t, { or, ilike }) =>
        or(ilike(t.name, like), ilike(t.phone, like), ilike(t.email, like)),
      with: { jobs: { columns: { id: true } } },
      orderBy: (t, { asc }) => [asc(t.name)],
      limit: 25,
    }),
  ]);

  const eyebrow =
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500";
  const row =
    "flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white p-3 transition hover:border-neutral-300";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <p className="text-sm text-neutral-500">
        Results for{" "}
        <span className="font-semibold text-[#101010]">{term}</span>
      </p>

      <h2 className={`${eyebrow} mt-6`}>Jobs</h2>
      {jobRows.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">No jobs match.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {jobRows.map((j) => (
            <li key={j.id}>
              <Link href={`/jobs/${j.id}`} className={row}>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-[#101010]">
                    {j.title}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">
                    {j.contact.name}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {j.valueEstimate != null ? (
                    <span className="text-xs text-neutral-500">
                      £{gbp.format(j.valueEstimate)}
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      j.stage.isTerminal
                        ? "bg-neutral-100 text-neutral-500"
                        : "border border-[#8EC63D]/50 bg-[#F4F9EA] text-[#3f6b12]"
                    }`}
                  >
                    {j.stage.name}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className={`${eyebrow} mt-8`}>Contacts</h2>
      {contactRows.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">No contacts match.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {contactRows.map((c) => (
            <li key={c.id}>
              <Link href={`/contacts/${c.id}`} className={row}>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-[#101010]">
                    {c.name}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">
                    {[c.phone, c.email].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                  {c.jobs.length} {c.jobs.length === 1 ? "job" : "jobs"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
