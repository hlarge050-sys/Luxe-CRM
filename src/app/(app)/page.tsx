// The job board, the front page of the CRM. Every job, every stage, one
// glance. Columns come from the job_stages table so the board and the data
// can never disagree.
import Link from "next/link";
import { getDb } from "@/db";
import { Board, type BoardJob, type BoardStage } from "@/components/board/board";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  // This page is force-dynamic, so this is the time of the request: the
  // anchor for every days-in-stage chip on the board.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  let stages: BoardStage[] = [];
  let jobs: BoardJob[] = [];
  let dbDown = false;

  try {
    const db = getDb();
    const [stageRows, jobRows] = await Promise.all([
      db.query.jobStages.findMany({
        orderBy: (t, { asc }) => [asc(t.position)],
      }),
      db.query.jobs.findMany({ with: { contact: true } }),
    ]);
    stages = stageRows.map((s) => ({
      id: s.id,
      name: s.name,
      position: s.position,
      isTerminal: s.isTerminal,
    }));
    jobs = jobRows.map((j) => ({
      id: j.id,
      title: j.title,
      reference: j.reference,
      stageId: j.stageId,
      stageChangedAt: j.stageChangedAt.toISOString(),
      contactName: j.contact.name,
      value: j.valueEstimate,
      place: j.siteTown ?? j.contact.town ?? j.sitePostcode ?? j.contact.postcode,
      visitAt: j.visitAt ? j.visitAt.toISOString() : null,
      lostReason: j.lostReason,
    }));
  } catch {
    dbDown = true;
  }

  return (
    <div className="w-full py-6">
      <div className="mb-4 flex items-center justify-between gap-3 px-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Job board
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="rounded-md bg-[#8EC63D] px-4 py-2.5 text-sm font-semibold text-[#101010] shadow-sm transition hover:brightness-95"
        >
          New enquiry
        </Link>
      </div>

      {dbDown ? (
        <p className="mx-4 rounded-md border border-neutral-200 border-l-[3px] border-l-[#8EC63D] bg-white p-5 text-sm shadow-sm">
          The database is not reachable. Deploys run migrations automatically,
          so check the latest deployment log on Vercel.
        </p>
      ) : (
        <Board stages={stages} jobs={jobs} now={now} />
      )}
    </div>
  );
}
