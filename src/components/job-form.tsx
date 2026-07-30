"use client";

// Edits the job facts: title, source, site address and the visit slot. Stage
// is deliberately not here, stage changes go through the board or the stage
// select so the Lost rule can never be sidestepped.

import { useActionState, useState, useSyncExternalStore } from "react";
import { updateJob } from "@/lib/actions";

const emptySubscribe = () => () => {};

const input =
  "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-[#8EC63D]";
const label = "block text-[13px] font-medium text-[#2C2C2A]";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function JobForm({
  job,
}: {
  job: {
    id: number;
    title: string;
    source: string | null;
    valueEstimate: number | null;
    visitAt: string | null;
    siteAddressLine1: string | null;
    siteTown: string | null;
    sitePostcode: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateJob.bind(null, job.id),
    undefined,
  );

  // The stored ISO time converts to input format in the device timezone, so
  // it renders empty on the server and fills on the client without a
  // hydration mismatch. Edits then overlay it.
  const deviceVisit = useSyncExternalStore(
    emptySubscribe,
    () => toLocalInput(job.visitAt),
    () => "",
  );
  const [editedVisit, setEditedVisit] = useState<string | null>(null);
  const visitLocal = editedVisit ?? deviceVisit;
  const visitIso = visitLocal ? new Date(visitLocal).toISOString() : "";

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-[4px] border border-neutral-200 bg-white p-4"
    >
      <input type="hidden" name="visitAt" value={visitIso} />

      <label className={label}>
        Job title
        <input name="title" required defaultValue={job.title} className={input} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Rough value (£)
          <input
            name="value"
            inputMode="numeric"
            defaultValue={job.valueEstimate ?? ""}
            placeholder="5900"
            className={input}
          />
        </label>
        <label className={label}>
          Where it came from
          <select name="source" defaultValue={job.source ?? ""} className={input}>
            <option value="">Not sure</option>
            <option>Checkatrade</option>
            <option>Google</option>
            <option>Word of mouth</option>
            <option>Website</option>
            <option>Returning client</option>
            <option>Other</option>
          </select>
        </label>
      </div>

      <label className={label}>
        Site visit
        <input
          type="datetime-local"
          value={visitLocal}
          onChange={(e) => setEditedVisit(e.target.value)}
          className={input}
        />
      </label>

      <label className={label}>
        Site address
        <input
          name="siteAddressLine1"
          defaultValue={job.siteAddressLine1 ?? ""}
          placeholder="Empty means the contact address"
          className={input}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Town
          <input name="siteTown" defaultValue={job.siteTown ?? ""} className={input} />
        </label>
        <label className={label}>
          Postcode
          <input
            name="sitePostcode"
            defaultValue={job.sitePostcode ?? ""}
            className={input}
          />
        </label>
      </div>

      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}

      <button
        disabled={pending}
        className="w-full rounded-md bg-[#101010] px-4 py-2.5 text-sm font-semibold text-[#8EC63D] disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
