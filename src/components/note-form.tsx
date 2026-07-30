"use client";

// Adds to the job timeline. Uncontrolled on purpose: React resets the fields
// itself once the action lands, so the form is ready for the next entry.

import { useActionState } from "react";
import { addNote } from "@/lib/actions";

export function NoteForm({ jobId }: { jobId: number }) {
  const [state, formAction, pending] = useActionState(
    addNote.bind(null, jobId),
    undefined,
  );

  return (
    <form
      action={formAction}
      className="rounded-md border border-neutral-200 bg-white p-3 shadow-sm"
    >
      <div className="flex gap-2">
        <select
          name="kind"
          defaultValue="note"
          aria-label="Entry type"
          className="self-start rounded-md border border-neutral-300 bg-white px-2 py-2 text-sm outline-none focus:border-[#8EC63D]"
        >
          <option value="note">Note</option>
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="sms">Text</option>
          <option value="visit">Visit</option>
        </select>
        <textarea
          name="body"
          rows={2}
          required
          placeholder="What happened?"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-[#8EC63D]"
        />
      </div>
      {state?.error ? (
        <p className="mt-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      <div className="mt-2 flex justify-end">
        <button
          disabled={pending}
          className="rounded-md bg-[#101010] px-4 py-2 text-sm font-semibold text-[#8EC63D] disabled:opacity-50"
        >
          {pending ? "Saving..." : "Add to timeline"}
        </button>
      </div>
    </form>
  );
}
