import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SLOT_POSITIONS, SLOT_THEMES, DAILY_FULL_RATE_MINUTES, type SlotPosition } from "@/lib/recipes";
import SlotRecordCard from "@/components/SlotRecordCard";
import AddSlotForm from "@/components/AddSlotForm";
import TodayProgress from "@/components/TodayProgress";

export default async function RecordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const todayStr = new Date().toISOString().slice(0, 10);

  const [{ data: slots }, { data: todayRecords }] = await Promise.all([
    supabase
      .from("slots")
      .select("id, position, label")
      .eq("user_id", user.id)
      .order("position", { ascending: true }),
    supabase
      .from("study_records")
      .select("slot_id, minutes")
      .eq("user_id", user.id)
      .eq("recorded_on", todayStr),
  ]);

  const minutesBySlot = new Map<string, number>();
  let minutesToday = 0;
  for (const r of todayRecords ?? []) {
    minutesBySlot.set(r.slot_id, (minutesBySlot.get(r.slot_id) ?? 0) + r.minutes);
    minutesToday += r.minutes;
  }

  const usedPositions = new Set((slots ?? []).map((s) => s.position));
  const availablePositions = SLOT_POSITIONS.filter((p) => !usedPositions.has(p));

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-2">TODAY&apos;S LOG</p>
          <h1 className="text-2xl font-bold">記録する</h1>
        </div>
        <TodayProgress minutesToday={minutesToday} cap={DAILY_FULL_RATE_MINUTES} />
      </div>

      {(!slots || slots.length === 0) && (
        <p className="panel mb-6 p-5 text-sm text-[var(--bp-text-muted)]">
          まだ科目スロットがありません。下のフォームから最初のスロットを登録しましょう。
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(slots ?? []).map((slot) => (
          <SlotRecordCard
            key={slot.id}
            slotId={slot.id}
            label={slot.label}
            theme={SLOT_THEMES[slot.position as SlotPosition]}
            minutesToday={minutesBySlot.get(slot.id) ?? 0}
          />
        ))}
      </div>

      {availablePositions.length > 0 && (
        <div className="mt-8">
          <AddSlotForm availablePositions={availablePositions} />
        </div>
      )}
    </div>
  );
}
