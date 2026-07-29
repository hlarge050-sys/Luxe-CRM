import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

type DbStatus = "ok" | "unset" | "error";

async function dbStatus(): Promise<DbStatus> {
  const url = process.env.DATABASE_URL;
  if (!url) return "unset";
  try {
    const sql = neon(url);
    await sql`select 1`;
    return "ok";
  } catch {
    return "error";
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
  const db = await dbStatus();

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Build progress
      </p>

      <section className="mt-3 rounded-md border border-neutral-200 border-l-[3px] border-l-[#8EC63D] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#101010] text-sm font-bold text-[#8EC63D]">
            0
          </span>
          <h1 className="text-lg font-bold tracking-tight text-[#101010]">
            Scaffold live
          </h1>
        </div>

        <ul className="mt-5 space-y-3 text-sm text-[#2C2C2A]">
          <li className="flex items-center justify-between gap-3">
            <span>Application deployed</span>
            <StatusPill tone="ok" label="Running" />
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>Sign in</span>
            <StatusPill tone="ok" label="Active" />
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>Database</span>
            {db === "ok" && <StatusPill tone="ok" label="Connected" />}
            {db === "unset" && (
              <StatusPill tone="wait" label="Add Neon in Vercel" />
            )}
            {db === "error" && (
              <StatusPill tone="wait" label="Check DATABASE_URL" />
            )}
          </li>
        </ul>
      </section>

      <p className="mt-6 text-sm text-neutral-500">
        Next milestone: M1, data foundation. Contact, Job, JobStage, Activity
        and FollowUp tables with seed data.
      </p>
    </div>
  );
}
