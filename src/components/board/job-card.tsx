"use client";

// A job card, Pipedrive anatomy in Luxe colours: title, person, value, and
// the rotting dot on the right that ambers after a week in a live stage and
// reds after a fortnight. Parked / waiting is exempt, parked is a decision.

import { useDraggable } from "@dnd-kit/core";
import type { BoardJob, BoardStage } from "./board";

const gbp = new Intl.NumberFormat("en-GB");
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/London",
});

export function daysIn(now: number, since: string) {
  return Math.max(0, Math.floor((now - +new Date(since)) / 86_400_000));
}

function dotClass(days: number, stage: BoardStage) {
  if (stage.isTerminal || stage.name === "Parked / waiting")
    return "bg-neutral-300";
  if (days >= 14) return "bg-red-500";
  if (days >= 7) return "bg-amber-400";
  return "bg-neutral-300";
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

  return (
    <div
      className={`rounded-[4px] border border-neutral-200 bg-white p-2.5 shadow-sm ${
        overlay ? "rotate-1 shadow-lg" : ""
      } ${dragging ? "opacity-40" : ""}`}
    >
      <p className="text-[13px] font-semibold leading-snug text-[#101010]">
        {job.title}
      </p>
      <p className="mt-0.5 truncate text-xs text-neutral-500">
        {job.contactName}
        {job.place ? `, ${job.place}` : ""}
      </p>
      {job.visitAt ? (
        <p className="mt-0.5 text-[11px] font-medium text-[#3f6b12]">
          Visit {dateFmt.format(new Date(job.visitAt))}
        </p>
      ) : null}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {job.value != null ? (
          <span className="text-xs font-semibold text-[#3f6b12]">
            £{gbp.format(job.value)}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
          {d === 0 ? "Today" : `${d}d`}
          <span
            className={`inline-block h-2 w-2 rounded-full ${dotClass(d, stage)}`}
            aria-label={`${d} days in ${stage.name}`}
          />
        </span>
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
