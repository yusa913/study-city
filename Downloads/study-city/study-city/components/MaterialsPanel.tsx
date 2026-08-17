import { SLOT_THEMES, type SlotPosition } from "@/lib/recipes";

export default function MaterialsPanel({
  commonAmount,
  dedicated,
  slotLabels,
}: {
  commonAmount: number;
  dedicated: { slot_position: SlotPosition; amount: number }[];
  slotLabels: Partial<Record<SlotPosition, string>>;
}) {
  return (
    <div className="panel p-5">
      <p className="label-eyebrow mb-3">MATERIALS</p>

      <div className="mb-4 flex items-center justify-between rounded-lg bg-[var(--bp-amber-soft)] px-3.5 py-3">
        <span className="text-sm text-[var(--bp-text-muted)]">共通資材（進行度）</span>
        <span className="text-lg font-bold text-[var(--bp-amber)]" style={{ fontFamily: "var(--font-mono)" }}>
          {Math.round(commonAmount)}
        </span>
      </div>

      <p className="mb-2 text-xs text-[var(--bp-text-faint)]">専用資材（装飾）</p>
      <ul className="flex flex-col gap-2">
        {dedicated
          .filter((d) => slotLabels[d.slot_position])
          .map((d) => {
            const theme = SLOT_THEMES[d.slot_position];
            return (
              <li key={d.slot_position} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: theme.color }}
                    aria-hidden
                  />
                  {slotLabels[d.slot_position]}
                  <span className="text-[var(--bp-text-faint)]">（{theme.themeName}）</span>
                </span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{Math.round(d.amount)}</span>
              </li>
            );
          })}
        {dedicated.filter((d) => slotLabels[d.slot_position]).length === 0 && (
          <li className="text-sm text-[var(--bp-text-faint)]">まだ記録がありません</li>
        )}
      </ul>
    </div>
  );
}
