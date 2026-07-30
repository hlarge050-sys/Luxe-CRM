"use client";

// The gate on Lost. Nothing goes to Lost without a reason, and the reason
// lands on the job and its timeline so the lost column can be read honestly
// later. The inner component mounts fresh each time the dialog opens, so the
// textarea always starts empty without any effect juggling.

import { useState } from "react";

type Props = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export function LostReasonDialog(props: Props) {
  if (!props.open) return null;
  return <LostReasonDialogInner {...props} />;
}

function LostReasonDialogInner({ busy, error, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Reason the job was lost"
    >
      <div className="w-full max-w-sm rounded-md border border-neutral-200 border-l-[3px] border-l-neutral-400 bg-white p-4 shadow-lg">
        <h2 className="text-[15px] font-bold tracking-tight text-[#101010]">
          Marking as Lost
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Every lost job carries a reason. It goes on the record.
        </p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Went with another quote, no reply after three chases, budget gone..."
          className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-[#8EC63D]"
        />
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:text-[#101010]"
          >
            Keep it live
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={busy || !reason.trim()}
            className="rounded-md bg-[#101010] px-4 py-2 text-sm font-semibold text-[#8EC63D] disabled:opacity-50"
          >
            {busy ? "Saving..." : "Confirm lost"}
          </button>
        </div>
      </div>
    </div>
  );
}
