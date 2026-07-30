// M1 raw data list. Deliberately unglamorous: every table, every row, straight
// from Postgres, so the foundation can be seen and prodded before M2 builds
// the board on top of it.
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function when(d: Date | null) {
  return d ? dateFmt.format(d) : "";
}

async function loadAll() {
  try {
    const db = getDb();
    const [stages, contactRows, jobRows, activityRows, followUpCount] =
      await Promise.all([
        db.query.jobStages.findMany({
          orderBy: (t, { asc }) => [asc(t.position)],
        }),
        db.query.contacts.findMany({
          orderBy: (t, { desc }) => [desc(t.createdAt)],
        }),
        db.query.jobs.findMany({
          with: { contact: true, stage: true },
          orderBy: (t, { desc }) => [desc(t.createdAt)],
        }),
        db.query.activities.findMany({
          with: { job: { columns: { reference: true, title: true } } },
          orderBy: (t, { desc }) => [desc(t.occurredAt)],
          limit: 50,
        }),
        db
          .execute(sql`select count(*)::int as n from follow_ups`)
          .then((r) => (r.rows[0] as { n: number }).n),
      ]);
    return { stages, contactRows, jobRows, activityRows, followUpCount };
  } catch {
    return null;
  }
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-md border border-neutral-200 border-l-[3px] border-l-[#8EC63D] bg-white p-5 shadow-sm first:mt-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold tracking-tight text-[#101010]">
          {title}
        </h2>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
          {count} {count === 1 ? "row" : "rows"}
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  );
}

const th =
  "py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500";
const td = "border-t border-neutral-100 py-2 pr-4 align-top text-[#2C2C2A]";

export default async function DataPage() {
  const data = await loadAll();

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Raw data
        </p>
        <section className="mt-3 rounded-md border border-neutral-200 border-l-[3px] border-l-[#8EC63D] bg-white p-5 text-sm shadow-sm">
          The database is not reachable or not migrated yet. Deploys run
          migrations automatically, so check the latest deployment log on
          Vercel.
        </section>
      </div>
    );
  }

  const { stages, contactRows, jobRows, activityRows, followUpCount } = data;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Raw data
      </p>

      <Section title="Job stages" count={stages.length}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={th}>Order</th>
              <th className={th}>Name</th>
              <th className={th}>Terminal</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s) => (
              <tr key={s.id}>
                <td className={td}>{s.position}</td>
                <td className={td}>{s.name}</td>
                <td className={td}>{s.isTerminal ? "Yes" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Contacts" count={contactRows.length}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Phone</th>
              <th className={th}>Email</th>
              <th className={th}>Address</th>
              <th className={th}>Source</th>
              <th className={th}>Added</th>
            </tr>
          </thead>
          <tbody>
            {contactRows.map((c) => (
              <tr key={c.id}>
                <td className={`${td} whitespace-nowrap font-medium`}>
                  {c.name}
                </td>
                <td className={`${td} whitespace-nowrap`}>{c.phone}</td>
                <td className={td}>{c.email}</td>
                <td className={td}>
                  {[c.addressLine1, c.town, c.postcode]
                    .filter(Boolean)
                    .join(", ")}
                </td>
                <td className={td}>{c.source}</td>
                <td className={`${td} whitespace-nowrap`}>
                  {when(c.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Jobs" count={jobRows.length}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={th}>Ref</th>
              <th className={th}>Title</th>
              <th className={th}>Contact</th>
              <th className={th}>Stage</th>
              <th className={th}>Site</th>
              <th className={th}>Added</th>
            </tr>
          </thead>
          <tbody>
            {jobRows.map((j) => (
              <tr key={j.id}>
                <td className={`${td} whitespace-nowrap font-medium`}>
                  {j.reference ?? ""}
                </td>
                <td className={td}>{j.title}</td>
                <td className={`${td} whitespace-nowrap`}>{j.contact.name}</td>
                <td className={`${td} whitespace-nowrap`}>
                  <span className="rounded-full border border-[#8EC63D]/50 bg-[#F4F9EA] px-2.5 py-0.5 text-xs font-medium text-[#3f6b12]">
                    {j.stage.name}
                  </span>
                </td>
                <td className={td}>
                  {[j.siteAddressLine1, j.siteTown, j.sitePostcode]
                    .filter(Boolean)
                    .join(", ")}
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  {when(j.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Activities" count={activityRows.length}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={th}>When</th>
              <th className={th}>Job</th>
              <th className={th}>Kind</th>
              <th className={th}>Body</th>
            </tr>
          </thead>
          <tbody>
            {activityRows.map((a) => (
              <tr key={a.id}>
                <td className={`${td} whitespace-nowrap`}>
                  {when(a.occurredAt)}
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  {a.job.reference ?? a.job.title}
                </td>
                <td className={`${td} whitespace-nowrap`}>{a.kind}</td>
                <td className={td}>{a.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Follow-ups" count={followUpCount}>
        <p className="text-sm text-neutral-500">
          Empty by design. The chase engine that fills this table lands at M3.
        </p>
      </Section>
    </div>
  );
}
