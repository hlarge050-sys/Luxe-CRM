"use client";

// A deal card matched to the Pipedrive screenshots: title with the activity
// indicator on the right (next visit date, or the amber triangle when
// nothing is booked ahead), person underneath, then avatar, the red day
// pill once a job has sat still a week, and the value. Rotten cards take
// the pale red tint. Parked / waiting never rots, parked is a decision.

import { useDraggable } from "@dnd-kit/core";
import { AvatarIcon, WarningIcon } from "@/components/icons";
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
  const parked = stage.name === "Parked / waiting";
  const stale = !stage.isTerminal && !parked && d >= 7;
  const upcomingVisit =
    job.visitAt != null && +new Date(job.visitAt) > now ? job.visitAt : null;
  const nothingBooked = !stage.isTerminal && !parked && upcomingVisit == null;

  return (
    <div
      className={`rounded-lg border p-3 shadow-sm ${
        stale ? "border-red-100 bg-[#FDF4F4]" : "border-neutral-200 bg-white"
      } ${overlay ? "rotate-1 shadow-lg" : ""} ${dragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-[#101010]">
          {job.title}
        </p>
        {upcomingVisit ? (
          <span
            className="shrink-0 pt-0.5 text-[11px] font-medium text-neutral-400"
            title="Next visit"
          >
            {dateFmt.format(new Date(upcomingVisit))}
          </span>
        ) : nothingBooked ? (
          <WarningIcon
            className="h-4 w-4 shrink-0 text-amber-500"
            aria-label="Nothing booked on this job"
          />
        ) : null}
      </div>
      <p className="mt-0.5 truncate text-[13px] text-neutral-500">
        {job.contactName}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <AvatarIcon className="h-4 w-4 text-neutral-300" />
        {stale ? (
          <span
            className="rounded bg-red-600 px-1.5 py-px text-[11px] font-bold text-white"
            title={`${d} days in ${stage.name}`}
          >
            {d}d
          </span>
        ) : null}
        <span className="text-[13px] text-neutral-500">
          £{gbp.format(job.value ?? 0)}
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
