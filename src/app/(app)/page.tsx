import Link from "next/link";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

type Counts = {
  stages: number;
  contacts: number;
  jobs: number;
  activities: number;
  follow_ups: number;
};

async function counts(): Promise<Counts | null> {
  try {
    const db = getDb();
    const res = await db.execute(sql`select
      (select count(*) from job_stages)::int as stages,
      (select count(*) from contacts)::int as contacts,
      (select count(*) from jobs)::int as jobs,
      (select count(*) from activities)::int as activities,
      (select count(*) from follow_ups)::int as follow_ups`);
    return res.rows[0] as unknown as Counts;
  } catch {
    return null;
  }
}

function StatusPill({ tone, label }: { tone: "ok" | "wait"; label: string }) {
  if (tone === "ok") {
    return (
      <span className="rounded-full border border-[#8EC63D]/50 bg-[#F4F9EA] px-2.5 py-0.5 text-xs font-medium text-[#3f6b12]">
        {label}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
      {label}
    </span>
  );
}

export default async function Home() {
  const c = await counts();

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Build progress
      </p>

      <section className="mt-3 rounded-md border border-neutral-200 border-l-[3px] border-l-[#8EC63D] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#101010] text-sm font-bold text-[#8EC63D]">
            1
          </span>
          <h1 className="text-lg font-bold tracking-tight text-[#101010]">
            Data foundation
          </h1>
        </div>

        <ul className="mt-5 space-y-3 text-sm text-[#2C2C2A]">
          <li className="flex items-center justify-between gap-3">
            <span>Schema</span>
            {c ? (
              <StatusPill tone="ok" label="Migrated" />
            ) : (
              <StatusPill tone="wait" label="Pending" />
            )}
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>Job stages</span>
            {c && c.stages === 9 ? (
              <StatusPill tone="ok" label="9 seeded" />
            ) : (
              <StatusPill tone="wait" label={c ? `${c.stages} of 9` : "Pending"} />
            )}
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>First job on the books</span>
            {c && c.jobs >= 1 ? (
              <StatusPill tone="ok" label="Ref 00001" />
            ) : (
              <StatusPill tone="wait" label="Pending" />
            )}
          </li>
        </ul>

        <Link
          href="/data"
          className="mt-6 inline-block rounded-md bg-[#101010] px-4 py-2 text-sm font-semibold text-[#8EC63D] transition hover:bg-black"
        >
          Open the raw data list
        </Link>
      </section>

      <p className="mt-6 text-sm text-neutral-500">
        Next milestone: M2, the job board. Kanban columns per stage, drag
        between stages, job detail with notes.
      </p>
    </div>
  );
}
