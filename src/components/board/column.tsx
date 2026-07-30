"use client";

// A pipeline lane, Pipedrive style: flat, separated by a hairline, header
// carrying the stage name with its value total and count, and a quick add
// straight into the lane.

import { useDroppable } from "@dnd-kit/core";
import { JobCard } from "./job-card";
import { QuickAddForm } from "./quick-add-form";
import type { BoardJob, BoardStage } from "./board";

const gbp = new Intl.NumberFormat("en-GB");

export function Lane({
  stage,
  jobs,
  total,
  now,
  onOpen,
  addOpen,
  onToggleAdd,
}: {
  stage: BoardStage;
  jobs: BoardJob[];
  total: number;
  now: number;
  onOpen: (jobId: number) => void;
  addOpen: boolean;
  onToggleAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}` });

  return (
    <section className="flex w-[82vw] max-w-[290px] shrink-0 snap-start flex-col border-r border-neutral-200 px-2 last:border-r-0 sm:w-[264px]">
      <div className="flex items-start justify-between gap-2 border-b-2 border-neutral-200 px-1 pb-2 pt-1">
        <div className="min-w-0">
          <h2 className="truncate text-[13px] font-semibold text-[#101010]">
            {stage.name}
          </h2>
          <p className="text-[11px] text-neutral-500">
            £{gbp.format(total)} · {jobs.length}{" "}
            {jobs.length === 1 ? "job" : "jobs"}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleAdd}
          aria-label={`Add a job to ${stage.name}`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-lg leading-none text-neutral-400 transition hover:bg-[#F4F9EA] hover:text-[#3f6b12]"
        >
          +
        </button>
      </div>

      {addOpen ? <QuickAddForm stageId={stage.id} onClose={onToggleAdd} /> : null}

      <div
        ref={setNodeRef}
        className={`flex min-h-28 flex-1 flex-col gap-2 py-2 transition-colors ${
          isOver ? "bg-[#F4F9EA]/70" : ""
        }`}
      >
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} stage={stage} now={now} onOpen={onOpen} />
        ))}
        {jobs.length === 0 && isOver ? (
          <p className="m-1 rounded border border-dashed border-[#8EC63D] px-2 py-3 text-center text-[11px] text-[#3f6b12]">
            Drop it here
          </p>
        ) : null}
      </div>
    </section>
  );
}
