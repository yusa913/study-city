export default function TodayProgress({
  minutesToday,
  cap,
}: {
  minutesToday: number;
  cap: number;
}) {
  const ratio = Math.min(1, minutesToday / cap);
  const overCap = minutesToday > cap;

  return (
    <div className="panel w-full max-w-[220px] p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="label-eyebrow">TODAY</span>
        <span
          className="text-sm font-bold"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {minutesToday}
          <span className="text-[var(--bp-text-faint)]">分</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bp-navy-950)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${ratio * 100}%`,
            background: overCap ? "var(--bp-danger)" : "var(--bp-amber)",
          }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-[var(--bp-text-faint)]">
        {overCap ? `${cap}分を超えた分は資材効率が下がります` : `${cap}分までは資材フル効率`}
      </p>
    </div>
  );
}
