"use client";

// M2 job board. Ten columns straight from the job_stages table, cards drag
// between them with a finger or a mouse, and a move into Lost demands a
// reason before it commits. Moves apply optimistically and revert if the
// server says no.

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { moveJobStage } from "@/lib/actions";
import { BoardColumn } from "./column";
import { JobCardBody } from "./job-card";
import { LostReasonDialog } from "./lost-reason-dialog";

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
  visitAt: string | null;
  lostReason: string | null;
};

type PendingLost = { jobId: number; fromStageId: number; toStageId: number };

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

  const lostStage = stages.find((s) => s.name === "Lost");

  const columns = useMemo(() => {
    const byStage = new Map<number, BoardJob[]>();
    for (const s of stages) byStage.set(s.id, []);
    for (const j of jobs) {
      byStage.get(overrides[j.id] ?? j.stageId)?.push(j);
    }
    for (const s of stages) {
      const list = byStage.get(s.id);
      if (!list) continue;
      list.sort((a, b) =>
        s.isTerminal
          ? +new Date(b.stageChangedAt) - +new Date(a.stageChangedAt)
          : +new Date(a.stageChangedAt) - +new Date(b.stageChangedAt),
      );
    }
    return byStage;
  }, [stages, jobs, overrides]);

  const activeJob =
    activeId == null ? null : (jobs.find((j) => j.id === activeId) ?? null);
  const activeStage = activeJob
    ? (stages.find(
        (s) => s.id === (overrides[activeJob.id] ?? activeJob.stageId),
      ) ?? null)
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

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    releaseClick();

    const jobId = Number(e.active.id);
    const overId = e.over?.id;
    if (typeof overId !== "string" || !overId.startsWith("stage-")) return;
    const toStageId = Number(overId.slice("stage-".length));

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

  return (
    <div>
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

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-6">
          {stages.map((s) => (
            <BoardColumn
              key={s.id}
              stage={s}
              jobs={columns.get(s.id) ?? []}
              now={now}
              onOpen={openJob}
            />
          ))}
        </div>
        <DragOverlay>
          {activeJob && activeStage ? (
            <JobCardBody job={activeJob} stage={activeStage} now={now} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>

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
