"use client";

import { useState, useTransition } from "react";
import { recordStudyTime } from "@/app/actions/record";
import type { SlotTheme } from "@/lib/recipes";

const QUICK_OPTIONS = [5, 15, 30, 60];

export default function SlotRecordCard({
  slotId,
  label,
  theme,
  minutesToday,
}: {
  slotId: string;
  label: string;
  theme: SlotTheme;
  minutesToday: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [customMinutes, setCustomMinutes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [localMinutes, setLocalMinutes] = useState(minutesToday);

  function submit(minutes: number) {
    if (isPending) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await recordStudyTime(slotId, minutes);
      if (result.ok) {
        setLocalMinutes((m) => m + minutes);
        setFeedback(
          result.buildingCompleted
            ? `+${Math.round(result.commonGain ?? 0)} 建材｜建物が完成しました！`
            : `+${Math.round(result.commonGain ?? 0)} 建材を獲得`
        );
        setCustomMinutes("");
      } else {
        setFeedback(result.error ?? "エラーが発生しました");
      }
    });
  }

  return (
    <div className="panel p-5" style={{ borderColor: `${theme.color}55` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 place-items-center rounded-md text-xs font-bold"
            style={{ background: theme.colorSoft, color: theme.color }}
          >
            {theme.position}
          </span>
          <div>
            <p className="font-bold leading-tight">{label}</p>
            <p className="text-[11px] leading-tight text-[var(--bp-text-faint)]">
              {theme.themeName}テーマ
            </p>
          </div>
        </div>
        <p className="text-sm text-[var(--bp-text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
          今日 {localMinutes}分
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_OPTIONS.map((m) => (
          <button
            key={m}
            disabled={isPending}
            onClick={() => submit(m)}
            className="btn-ghost px-3.5 py-2 text-sm disabled:opacity-40"
          >
            +{m}分
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={600}
          value={customMinutes}
          onChange={(e) => setCustomMinutes(e.target.value)}
          placeholder="任意の分数"
          className="w-28 rounded-lg border border-[var(--bp-grid-line-strong)] bg-[var(--bp-navy-950)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--bp-cyan)]"
        />
        <button
          disabled={isPending || !customMinutes}
          onClick={() => submit(Number(customMinutes))}
          className="btn-primary px-3.5 py-1.5 text-sm disabled:opacity-40"
        >
          記録
        </button>
      </div>

      {feedback && (
        <p className="mt-2.5 text-xs text-[var(--bp-amber)]">{feedback}</p>
      )}
    </div>
  );
}
