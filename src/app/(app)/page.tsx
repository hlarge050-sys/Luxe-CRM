// The pipeline, front page of the CRM. All chrome lives in the Board
// component; this page fetches and maps.
import { getDb } from "@/db";
import { Board, type BoardJob, type BoardStage } from "@/components/board/board";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  // This page is force-dynamic, so this is the time of the request: the
  // anchor for every rotting indicator on the board.
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
      place: j.siteTown ?? j.contact.town ?? j.sitePostcode ?? j.contact.postcode,
      value: j.valueEstimate,
      visitAt: j.visitAt ? j.visitAt.toISOString() : null,
      lostReason: j.lostReason,
    }));
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

  return <Board stages={stages} jobs={jobs} now={now} />;
}
