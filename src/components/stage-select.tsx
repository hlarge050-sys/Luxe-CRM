"use client";

// Stage control on the job page: the phone-friendly alternative to dragging.
// Same rule as the board, a move to Lost demands a reason first.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moveJobStage } from "@/lib/actions";
import { LostReasonDialog } from "./board/lost-reason-dialog";

type Stage = { id: number; name: string; position: number };

export function StageSelect({
  jobId,
  stages,
  currentStageId,
}: {
  jobId: number;
  stages: Stage[];
  currentStageId: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pendingLost, setPendingLost] = useState(false);
  const [lostBusy, setLostBusy] = useState(false);
  const [lostError, setLostError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lost = stages.find((s) => s.name === "Lost");

  function change(toId: number) {
    if (toId === currentStageId) return;
    if (lost && toId === lost.id) {
      setLostError(null);
      setPendingLost(true);
      return;
    }
    setError(null);
    setBusy(true);
    moveJobStage(jobId, toId)
      .then((res) => {
        if (res.ok) router.refresh();
        else setError(res.error);
      })
      .catch(() => setError("The change did not save. Try again."))
      .finally(() => setBusy(false));
  }

  function confirmLost(reason: string) {
    if (!lost) return;
    setLostBusy(true);
    setLostError(null);
    moveJobStage(jobId, lost.id, reason)
      .then((res) => {
        if (res.ok) {
          setPendingLost(false);
          router.refresh();
        } else {
          setLostError(res.error);
        }
      })
      .catch(() => setLostError("The change did not save. Try again."))
      .finally(() => setLostBusy(false));
  }

  return (
    <div>
      <select
        aria-label="Stage"
        value={currentStageId}
        onChange={(e) => change(Number(e.target.value))}
        disabled={busy}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base font-medium text-[#101010] outline-none focus:border-[#8EC63D] disabled:opacity-60"
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>
            {s.position}. {s.name}
          </option>
        ))}
      </select>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <LostReasonDialog
        open={pendingLost}
        busy={lostBusy}
        error={lostError}
        onConfirm={confirmLost}
        onCancel={() => setPendingLost(false)}
      />
    </div>
  );
}
