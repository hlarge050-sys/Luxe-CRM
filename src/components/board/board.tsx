"use client";

// The pipeline, Pipedrive layout in Luxe colours. Live stages run as flat
// lanes with value totals, Complete and Lost live behind drop zones that
// rise while a card is dragged, and each has its own tab. Moves apply
// optimistically and revert if the server says no.

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { moveJobStage } from "@/lib/actions";
import { BoardIcon, ListIcon, PlusIcon, WarningIcon } from "@/components/icons";
import { Lane } from "./column";
import { JobCardBody, daysIn } from "./job-card";
import { LostReasonDialog } from "./lost-reason-dialog";
import { ZonesBar } from "./zones-bar";

export type BoardStage = {
  id: number;
  name: string;
  position: number;
  isTerminal: boolean;
};

export type BoardJob = {
  id: number;
  title: string;
  reference: string | null;
  stageId: number;
  stageChangedAt: string;
  contactName: string;
  place: string | null;
  value: number | null;
  visitAt: string | null;
  lostReason: string | null;
};

type PendingLost = { jobId: number; fromStageId: number; toStageId: number };
type Tab = "pipeline" | "complete" | "lost";

const gbp = new Intl.NumberFormat("en-GB");
const rowDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/London",
});

export function Board({
  stages,
  jobs,
  now,
}: {
  stages: BoardStage[];
  jobs: BoardJob[];
  now: number;
}) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<number, number>>({});
  const [activeId, setActiveId] = useState<number | null>(null);
  const [pendingLost, setPendingLost] = useState<PendingLost | null>(null);
  const [lostBusy, setLostBusy] = useState(false);
  const [lostError, setLostError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pipeline");
  const [view, setView] = useState<"board" | "list">("board");
  const [openAdds, setOpenAdds] = useState<Record<number, boolean>>({});
  const suppressClick = useRef(false);

  // Fresh data from the server wins over any local optimism. Adjusted during
  // render, the pattern React recommends for prop-driven state resets.
  const [seenJobs, setSeenJobs] = useState(jobs);
  if (seenJobs !== jobs) {
    setSeenJobs(jobs);
    setOverrides({});
  }

  const sensors = useSensors(
    // A mouse needs a little travel before a drag starts, so plain clicks
    // still open the job. A finger needs a short hold, so the board can
    // still be scrolled.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  );

  const liveStages = useMemo(() => stages.filter((s) => !s.isTerminal), [stages]);
  const completeStage = stages.find((s) => s.name === "Complete") ?? null;
  const lostStage = stages.find((s) => s.name === "Lost") ?? null;

  const effectiveStage = (j: BoardJob) => overrides[j.id] ?? j.stageId;

  const lanes = useMemo(() => {
    const byStage = new Map<number, BoardJob[]>();
    for (const s of liveStages) byStage.set(s.id, []);
    for (const j of jobs) {
      byStage.get(overrides[j.id] ?? j.stageId)?.push(j);
    }
    for (const list of byStage.values()) {
      list.sort(
        (a, b) => +new Date(a.stageChangedAt) - +new Date(b.stageChangedAt),
      );
    }
    return byStage;
  }, [liveStages, jobs, overrides]);

  const laneTotals = useMemo(() => {
    const totals = new Map<number, number>();
    for (const [sid, list] of lanes) {
      totals.set(
        sid,
        list.reduce((sum, j) => sum + (j.value ?? 0), 0),
      );
    }
    return totals;
  }, [lanes]);

  const liveJobs = jobs.filter((j) => {
    const sid = effectiveStage(j);
    return sid !== completeStage?.id && sid !== lostStage?.id;
  });
  const pipelineTotal = liveJobs.reduce((sum, j) => sum + (j.value ?? 0), 0);

  const terminalList = (stageId: number | undefined) =>
    stageId == null
      ? []
      : jobs
          .filter((j) => effectiveStage(j) === stageId)
          .sort(
            (a, b) => +new Date(b.stageChangedAt) - +new Date(a.stageChangedAt),
          );
  const completeJobs = terminalList(completeStage?.id);
  const lostJobs = terminalList(lostStage?.id);

  const activeJob =
    activeId == null ? null : (jobs.find((j) => j.id === activeId) ?? null);
  const activeStage = activeJob
    ? (stages.find((s) => s.id === effectiveStage(activeJob)) ?? null)
    : null;

  function applyMove(jobId: number, toStageId: number, fromStageId: number) {
    setOverrides((o) => ({ ...o, [jobId]: toStageId }));
    moveJobStage(jobId, toStageId)
      .then((res) => {
        if (res.ok) {
          router.refresh();
        } else {
          setOverrides((o) => ({ ...o, [jobId]: fromStageId }));
          setError(res.error);
        }
      })
      .catch(() => {
        setOverrides((o) => ({ ...o, [jobId]: fromStageId }));
        setError("The move did not save. Check the connection and try again.");
      });
  }

  function onDragStart(e: DragStartEvent) {
    suppressClick.current = true;
    setActiveId(Number(e.active.id));
    setError(null);
  }

  function releaseClick() {
    setTimeout(() => {
      suppressClick.current = false;
    }, 0);
  }

  function resolveTarget(overId: string): number | null {
    if (overId.startsWith("stage-")) return Number(overId.slice("stage-".length));
    if (overId === "zone-complete") return completeStage?.id ?? null;
    if (overId === "zone-lost") return lostStage?.id ?? null;
    return null;
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    releaseClick();

    const jobId = Number(e.active.id);
    const overId = e.over?.id;
    if (typeof overId !== "string") return;
    const toStageId = resolveTarget(overId);
    if (toStageId == null) return;

    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const fromStageId = overrides[jobId] ?? job.stageId;
    if (toStageId === fromStageId) return;

    if (lostStage && toStageId === lostStage.id) {
      // Park the card in Lost visually, but nothing commits until a reason
      // goes in. Cancelling puts it straight back.
      setOverrides((o) => ({ ...o, [jobId]: toStageId }));
      setLostError(null);
      setPendingLost({ jobId, fromStageId, toStageId });
      return;
    }

    applyMove(jobId, toStageId, fromStageId);
  }

  function onDragCancel() {
    setActiveId(null);
    releaseClick();
  }

  function openJob(id: number) {
    if (suppressClick.current) return;
    router.push(`/jobs/${id}`);
  }

  function confirmLost(reason: string) {
    if (!pendingLost) return;
    setLostBusy(true);
    setLostError(null);
    moveJobStage(pendingLost.jobId, pendingLost.toStageId, reason)
      .then((res) => {
        if (res.ok) {
          setPendingLost(null);
          router.refresh();
        } else {
          setLostError(res.error);
        }
      })
      .catch(() =>
        setLostError("The move did not save. Check the connection and try again."),
      )
      .finally(() => setLostBusy(false));
  }

  function cancelLost() {
    if (pendingLost) {
      const { jobId, fromStageId } = pendingLost;
      setOverrides((o) => ({ ...o, [jobId]: fromStageId }));
    }
    setPendingLost(null);
    setLostError(null);
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
        tab === t
          ? "bg-[#101010] text-white"
          : "text-neutral-500 hover:text-[#101010]"
      }`}
    >
      {label}
    </button>
  );

  const viewBtn = (v: "board" | "list", Icon: typeof BoardIcon, label: string) => (
    <button
      type="button"
      onClick={() => setView(v)}
      aria-label={label}
      title={label}
      className={`flex h-9 w-10 items-center justify-center transition ${
        view === v
          ? "bg-[#F4F9EA] text-[#3f6b12]"
          : "bg-white text-neutral-400 hover:text-neutral-600"
      }`}
    >
      <Icon className="h-4.5 w-4.5" />
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 px-4 pt-4">
        <div className="flex divide-x divide-neutral-300 overflow-hidden rounded-md border border-neutral-300">
          {viewBtn("board", BoardIcon, "Board view")}
          {viewBtn("list", ListIcon, "List view")}
        </div>
        <Link
          href="/jobs/new"
          className="flex items-center gap-1.5 rounded-md bg-[#8EC63D] px-3.5 py-2 text-sm font-semibold text-[#101010] transition hover:brightness-95"
        >
          <PlusIcon className="h-4 w-4" />
          Job
        </Link>
        <p className="ml-auto text-[13px] text-neutral-500">
          <span className="font-semibold text-[#101010]">
            £{gbp.format(pipelineTotal)}
          </span>{" "}
          · {liveJobs.length} live {liveJobs.length === 1 ? "job" : "jobs"}
        </p>
      </div>

      {view === "board" ? (
        <div className="mt-3 flex items-center gap-1 px-4 pb-3">
          {tabBtn("pipeline", "Pipeline")}
          {tabBtn("complete", `Complete ${completeJobs.length}`)}
          {tabBtn("lost", `Lost ${lostJobs.length}`)}
        </div>
      ) : (
        <div className="pb-3" />
      )}

      {error ? (
        <div className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {view === "list" ? (
        <JobsList stages={stages} jobs={jobs} effectiveStage={effectiveStage} now={now} />
      ) : tab === "pipeline" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <div className="flex snap-x overflow-x-auto border-y border-neutral-200 bg-[#F3F4F1] px-2 pb-4 pt-1">
            {liveStages.map((s) => (
              <Lane
                key={s.id}
                stage={s}
                jobs={lanes.get(s.id) ?? []}
                total={laneTotals.get(s.id) ?? 0}
                now={now}
                onOpen={openJob}
                addOpen={Boolean(openAdds[s.id])}
                onToggleAdd={() =>
                  setOpenAdds((o) => ({ ...o, [s.id]: !o[s.id] }))
                }
              />
            ))}
          </div>
          <DragOverlay>
            {activeJob && activeStage ? (
              <JobCardBody job={activeJob} stage={activeStage} now={now} overlay />
            ) : null}
          </DragOverlay>
          <ZonesBar active={activeId != null} />
        </DndContext>
      ) : (
        <TerminalList
          jobs={tab === "complete" ? completeJobs : lostJobs}
          lost={tab === "lost"}
        />
      )}

      <LostReasonDialog
        open={pendingLost != null}
        busy={lostBusy}
        error={lostError}
        onConfirm={confirmLost}
        onCancel={cancelLost}
      />
    </div>
  );
}

function JobsList({
  stages,
  jobs,
  effectiveStage,
  now,
}: {
  stages: BoardStage[];
  jobs: BoardJob[];
  effectiveStage: (j: BoardJob) => number;
  now: number;
}) {
  const stageById = new Map(stages.map((s) => [s.id, s]));
  const rows = [...jobs].sort((a, b) => {
    const sa = stageById.get(effectiveStage(a));
    const sb = stageById.get(effectiveStage(b));
    if (sa && sb && sa.position !== sb.position) return sa.position - sb.position;
    return +new Date(a.stageChangedAt) - +new Date(b.stageChangedAt);
  });

  const th =
    "whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500";
  const td = "border-t border-neutral-100 px-3 py-2.5 align-middle";

  if (rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-neutral-400">
        Nothing on the books yet.
      </p>
    );
  }

  return (
    <div className="mx-4 mb-8 overflow-x-auto rounded-md border border-neutral-200 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr>
            <th className={th}>Job</th>
            <th className={th}>Contact</th>
            <th className={th}>Stage</th>
            <th className={th}>Value</th>
            <th className={th}>In stage</th>
            <th className={th}>Visit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((j) => {
            const stage = stageById.get(effectiveStage(j));
            const d = daysIn(now, j.stageChangedAt);
            const parked = stage?.name === "Parked / waiting";
            const stale = stage && !stage.isTerminal && !parked && d >= 7;
            const upcoming =
              j.visitAt != null && +new Date(j.visitAt) > now ? j.visitAt : null;
            return (
              <tr key={j.id} className="hover:bg-neutral-50">
                <td className={`${td} font-semibold text-[#101010]`}>
                  <Link
                    href={`/jobs/${j.id}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {j.title}
                  </Link>
                </td>
                <td className={`${td} whitespace-nowrap text-neutral-600`}>
                  {j.contactName}
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      stage?.isTerminal
                        ? "bg-neutral-100 text-neutral-500"
                        : "border border-[#8EC63D]/50 bg-[#F4F9EA] text-[#3f6b12]"
                    }`}
                  >
                    {stage?.name ?? ""}
                  </span>
                </td>
                <td className={`${td} whitespace-nowrap text-neutral-600`}>
                  £{gbp.format(j.value ?? 0)}
                </td>
                <td
                  className={`${td} whitespace-nowrap ${
                    stale ? "font-semibold text-red-600" : "text-neutral-500"
                  }`}
                >
                  {d === 0 ? "Today" : `${d}d`}
                </td>
                <td className={`${td} whitespace-nowrap text-neutral-500`}>
                  {upcoming ? (
                    rowDate.format(new Date(upcoming))
                  ) : stage && !stage.isTerminal && !parked ? (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <WarningIcon className="h-3.5 w-3.5" />
                      None
                    </span>
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TerminalList({ jobs, lost }: { jobs: BoardJob[]; lost: boolean }) {
  if (jobs.length === 0) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-8 text-center text-sm text-neutral-400">
        {lost ? "Nothing lost. Keep it that way." : "Nothing completed yet."}
      </p>
    );
  }
  return (
    <ul className="mx-auto max-w-3xl space-y-2 px-4 pb-8">
      {jobs.map((j) => (
        <li key={j.id}>
          <Link
            href={`/jobs/${j.id}`}
            className="flex items-center justify-between gap-3 rounded-[4px] border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-neutral-300"
          >
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold text-[#101010]">
                {j.title}
              </span>
              <span className="block truncate text-xs text-neutral-500">
                {j.contactName}
                {lost && j.lostReason ? (
                  <span className="italic"> · {j.lostReason}</span>
                ) : null}
              </span>
            </span>
            <span className="shrink-0 text-right">
              {j.value != null ? (
                <span className="block text-xs font-semibold text-[#3f6b12]">
                  £{gbp.format(j.value)}
                </span>
              ) : null}
              <span className="block text-[11px] text-neutral-400">
                {rowDate.format(new Date(j.stageChangedAt))}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
