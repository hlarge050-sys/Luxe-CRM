"use client";

// One stage, one column. The header mirrors the stage cards on the printed
// Luxe paperwork: black numbered badge, green left border. Lost sits at the
// end in grey, deliberately drab.

import { useDroppable } from "@dnd-kit/core";
import { JobCard } from "./job-card";
import type { BoardJob, BoardStage } from "./board";

export function BoardColumn({
  stage,
  jobs,
  now,
  onOpen,
}: {
  stage: BoardStage;
  jobs: BoardJob[];
  now: number;
  onOpen: (jobId: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}` });
  const lost = stage.name === "Lost";

  return (
    <section
      className={`w-[82vw] max-w-[290px] shrink-0 snap-start self-start rounded-md border border-neutral-200 border-l-[3px] bg-white shadow-sm sm:w-[272px] ${
        lost ? "border-l-neutral-300" : "border-l-[#8EC63D]"
      }`}
    >
      <header className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2.5">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            lost ? "bg-neutral-200 text-neutral-600" : "bg-[#101010] text-[#8EC63D]"
          }`}
        >
          {stage.position}
        </span>
        <h2 className="truncate text-[13px] font-bold tracking-tight text-[#101010]">
          {stage.name}
        </h2>
        <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
          {jobs.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-col gap-2 p-2 transition-colors ${
          isOver ? "bg-[#F4F9EA]" : ""
        }`}
      >
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} stage={stage} now={now} onOpen={onOpen} />
        ))}
        {jobs.length === 0 ? (
          <p
            className={`m-1 rounded border border-dashed px-2 py-3 text-center text-[11px] ${
              isOver
                ? "border-[#8EC63D] text-[#3f6b12]"
                : "border-neutral-200 text-neutral-300"
            }`}
          >
            Nothing here
          </p>
        ) : null}
      </div>
    </section>
  );
}
