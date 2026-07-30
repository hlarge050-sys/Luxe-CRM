"use client";

// The deal-page controls, Pipedrive shape in Luxe colours: a chevron bar of
// the live stages that fills green up to where the job sits, tap a segment
// to move it, and Complete and Lost buttons for the outcomes. Lost keeps its
// reason gate. On a lost or completed job the bar sits empty, and tapping
// any segment reopens the job into that stage.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moveJobStage } from "@/lib/actions";
import { LostReasonDialog } from "./board/lost-reason-dialog";

type Stage = {
  id: number;
  name: string;
  position: number;
  isTerminal: boolean;
};

function segmentClip(first: boolean) {
  return first
    ? "[clip-path:polygon(0_0,calc(100%-7px)_0,100%_50%,calc(100%-7px)_100%,0_100%)]"
    : "[clip-path:polygon(0_0,calc(100%-7px)_0,100%_50%,calc(100%-7px)_100%,0_100%,7px_50%)]";
}

export function StageControls({
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

  const live = stages.filter((s) => !s.isTerminal);
  const completeStage = stages.find((s) => s.name === "Complete") ?? null;
  const lostStage = stages.find((s) => s.name === "Lost") ?? null;
  const current = stages.find((s) => s.id === currentStageId) ?? null;
  const currentIndex = live.findIndex((s) => s.id === currentStageId);
  const onLost = lostStage != null && currentStageId === lostStage.id;
  const onComplete = completeStage != null && currentStageId === completeStage.id;

  function move(toId: number) {
    if (busy || toId === currentStageId) return;
    if (lostStage && toId === lostStage.id) {
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
    if (!lostStage) return;
    setLostBusy(true);
    setLostError(null);
    moveJobStage(jobId, lostStage.id, reason)
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
      <div className="flex h-9 gap-[3px]" role="group" aria-label="Stage">
        {live.map((s, i) => {
          const filled = currentIndex >= 0 && i <= currentIndex;
          return (
            <button
              key={s.id}
              type="button"
              title={s.name}
              aria-label={`Move to ${s.name}`}
              aria-current={s.id === currentStageId ? "step" : undefined}
              disabled={busy}
              onClick={() => move(s.id)}
              className={`h-full flex-1 transition ${segmentClip(i === 0)} ${
                filled
                  ? "bg-[#8EC63D] hover:brightness-105"
                  : "bg-neutral-200 hover:bg-neutral-300"
              } disabled:opacity-60`}
            />
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[#2C2C2A]">
          {onLost ? (
            <span className="font-semibold text-neutral-600">Lost</span>
          ) : onComplete ? (
            <span className="font-semibold text-[#3f6b12]">Complete</span>
          ) : (
            <span>
              Stage:{" "}
              <span className="font-semibold text-[#101010]">
                {current?.name ?? ""}
              </span>
            </span>
          )}
          {onLost || onComplete ? (
            <span className="text-neutral-400"> · tap a stage to reopen</span>
          ) : null}
        </p>

        <div className="flex gap-2">
          {!onComplete && completeStage ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => move(completeStage.id)}
              className="rounded-[4px] bg-[#8EC63D] px-3.5 py-1.5 text-[13px] font-semibold text-[#101010] transition hover:brightness-95 disabled:opacity-50"
            >
              Complete
            </button>
          ) : null}
          {!onLost && lostStage ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => move(lostStage.id)}
              className="rounded-[4px] border border-neutral-300 px-3.5 py-1.5 text-[13px] font-semibold text-neutral-600 transition hover:border-red-300 hover:text-red-700 disabled:opacity-50"
            >
              Lost
            </button>
          ) : null}
        </div>
      </div>

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
