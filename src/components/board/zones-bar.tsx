"use client";

// The Pipedrive move: start dragging a card and the outcome zones rise from
// the bottom of the screen. Lost still demands its reason before anything
// commits. The bar stays mounted and slides off-screen when idle so dnd-kit
// always has the droppables registered.

import { useDroppable } from "@dnd-kit/core";

function Zone({
  id,
  label,
  base,
  over,
}: {
  id: string;
  label: string;
  base: string;
  over: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex h-16 items-center justify-center rounded-md text-sm font-bold uppercase tracking-[0.18em] shadow-lg transition ${
        isOver ? over : base
      }`}
    >
      {label}
    </div>
  );
}

export function ZonesBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden={!active}
      className={`fixed inset-x-0 bottom-0 z-40 p-3 transition-transform duration-150 ${
        active ? "translate-y-0" : "pointer-events-none translate-y-[130%]"
      }`}
    >
      <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-3">
        <Zone
          id="zone-lost"
          label="Lost"
          base="bg-[#101010] text-white"
          over="scale-[1.03] bg-red-600 text-white"
        />
        <Zone
          id="zone-complete"
          label="Complete"
          base="bg-[#8EC63D] text-[#101010]"
          over="scale-[1.03] bg-[#8EC63D] text-[#101010] ring-2 ring-[#101010]"
        />
      </div>
    </div>
  );
}
