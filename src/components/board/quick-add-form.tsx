"use client";

// Pipedrive-style quick add: three fields typed straight into the lane. The
// fields are uncontrolled so React clears them the moment an add lands, and
// the form stays open for the next one. The new card appearing in the lane
// is the confirmation.

import { useActionState } from "react";
import { quickAddJob } from "@/lib/actions";

const input =
  "w-full rounded-[4px] border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#8EC63D]";

export function QuickAddForm({
  stageId,
  onClose,
}: {
  stageId: number;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    quickAddJob.bind(null, stageId),
    undefined,
  );

  return (
    <form
      action={formAction}
      className="mt-2 space-y-2 rounded-[4px] border border-neutral-200 bg-white p-2 shadow-sm"
    >
      <input name="title" required placeholder="Job title" className={input} />
      <input
        name="contactName"
        required
        placeholder="Contact name"
        className={input}
      />
      <input
        name="value"
        inputMode="numeric"
        placeholder="Value £ (optional)"
        className={input}
      />
      {state?.error ? (
        <p className="text-xs text-red-700">{state.error}</p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <button
          disabled={pending}
          className="rounded-[4px] bg-[#8EC63D] px-3 py-1.5 text-xs font-semibold text-[#101010] disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add job"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-2 py-1.5 text-xs font-medium text-neutral-500 hover:text-[#101010]"
        >
          Close
        </button>
      </div>
    </form>
  );
}
