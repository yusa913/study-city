"use client";

import { useState, useTransition } from "react";
import { createSlot } from "@/app/actions/slots";
import { SLOT_THEMES, type SlotPosition } from "@/lib/recipes";

export default function AddSlotForm({
  availablePositions,
}: {
  availablePositions: SlotPosition[];
}) {
  const [position, setPosition] = useState<SlotPosition>(availablePositions[0]);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await createSlot(position, label);
          if (result.ok) {
            setLabel("");
          } else {
            setError(result.error ?? "エラーが発生しました");
          }
        });
      }}
      className="panel flex flex-wrap items-end gap-3 p-5"
    >
      <div>
        <p className="label-eyebrow mb-1.5">新しいスロット</p>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value as SlotPosition)}
          className="rounded-lg border border-[var(--bp-grid-line-strong)] bg-[var(--bp-navy-950)] px-2.5 py-2 text-sm outline-none focus:border-[var(--bp-cyan)]"
        >
          {availablePositions.map((p) => (
            <option key={p} value={p}>
              {p}｜{SLOT_THEMES[p].themeName}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        required
        maxLength={30}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="例：英語、簿記、プログラミング学習"
        className="min-w-[200px] flex-1 rounded-lg border border-[var(--bp-grid-line-strong)] bg-[var(--bp-navy-950)] px-3 py-2 text-sm outline-none focus:border-[var(--bp-cyan)]"
      />

      <button disabled={isPending} className="btn-primary px-4 py-2 text-sm disabled:opacity-40">
        追加する
      </button>

      {error && <p className="w-full text-xs text-[var(--bp-danger)]">{error}</p>}
    </form>
  );
}
