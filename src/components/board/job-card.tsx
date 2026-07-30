"use client";

// A job on the board. Drags with a hold on touch or a short pull with the
// mouse, opens with a plain tap. The days-in-stage chip turns amber after a
// week in any live stage, because jobs going quiet is exactly what this CRM
// exists to stop. Parked / waiting is exempt: parked is a decision.

import { useDraggable } from "@dnd-kit/core";
import type { BoardJob, BoardStage } from "./board";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/London",
});

function daysIn(now: number, since: string) {
  return Math.max(0, Math.floor((now - +new Date(since)) / 86_400_000));
}

export function JobCardBody({
  job,
  stage,
  now,
  dragging = false,
  overlay = false,
}: {
  job: BoardJob;
  stage: BoardStage;
  now: number;
  dragging?: boolean;
  overlay?: boolean;
}) {
  const d = daysIn(now, job.stageChangedAt);
  const stale = !stage.isTerminal && stage.name !== "Parked / waiting" && d >= 7;

  return (
    <div
      className={`rounded-md border border-neutral-200 bg-white p-3 shadow-sm ${
        overlay ? "rotate-1 shadow-lg ring-1 ring-[#8EC63D]/40" : ""
      } ${dragging ? "opacity-40" : ""}`}
    >
      <p className="text-[13px] font-semibold leading-snug text-[#101010]">
        {job.title}
      </p>
      <p className="mt-0.5 truncate text-xs text-neutral-600">
        {job.contactName}
        {job.place ? `, ${job.place}` : ""}
      </p>
      {stage.name === "Lost" && job.lostReason ? (
        <p className="mt-1 truncate text-xs italic text-neutral-500">
          {job.lostReason}
        </p>
      ) : null}
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            stale
              ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {d === 0 ? "Today" : `${d}d in stage`}
        </span>
        {job.visitAt ? (
          <span className="rounded-full bg-[#F4F9EA] px-2 py-0.5 text-[11px] font-medium text-[#3f6b12]">
            Visit {dateFmt.format(new Date(job.visitAt))}
          </span>
        ) : null}
        {job.reference ? (
          <span className="ml-auto text-[11px] font-semibold text-neutral-400">
            {job.reference}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function JobCard({
  job,
  stage,
  now,
  onOpen,
}: {
  job: BoardJob;
  stage: BoardStage;
  now: number;
  onOpen: (jobId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: job.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(job.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(job.id);
      }}
      className="cursor-grab touch-manipulation select-none outline-none focus-visible:ring-2 focus-visible:ring-[#8EC63D] active:cursor-grabbing"
      aria-label={`Open ${job.title}`}
    >
      <JobCardBody job={job} stage={stage} now={now} dragging={isDragging} />
    </div>
  );
}
