import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IsometricCity from "@/components/IsometricCity";
import MaterialsPanel from "@/components/MaterialsPanel";
import { STAGE_LABELS, getTierLabel, type SlotPosition } from "@/lib/recipes";

export default async function CityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: buildings }, { data: commonRow }, { data: dedicatedRows }, { data: slots }] =
    await Promise.all([
      supabase
        .from("buildings")
        .select("id, building_index, stage, common_invested")
        .eq("user_id", user.id)
        .order("building_index", { ascending: true }),
      supabase.from("material_common").select("amount").eq("user_id", user.id).maybeSingle(),
      supabase.from("material_dedicated").select("slot_position, amount").eq("user_id", user.id),
      supabase.from("slots").select("position, label").eq("user_id", user.id),
    ]);

  const buildingIds = (buildings ?? []).map((b) => b.id);
  const { data: decorations } =
    buildingIds.length > 0
      ? await supabase
          .from("building_decorations")
          .select("building_id, slot_position, amount")
          .in("building_id", buildingIds)
      : { data: [] };

  const cityBuildings = (buildings ?? []).map((b) => ({
    ...b,
    decorations: (decorations ?? [])
      .filter((d) => d.building_id === b.id)
      .map((d) => ({ slot_position: d.slot_position as SlotPosition, amount: d.amount })),
  }));

  const completedCount = cityBuildings.filter((b) => b.stage === 3).length;
  const active = cityBuildings.find((b) => b.stage < 3);

  const slotLabels: Partial<Record<SlotPosition, string>> = {};
  for (const s of slots ?? []) slotLabels[s.position as SlotPosition] = s.label;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-2">YOUR CITY</p>
          <h1 className="text-2xl font-bold">街の俯瞰図</h1>
        </div>
        <div className="flex gap-6 text-sm">
          <Stat label="完成した棟" value={`${completedCount}棟`} />
          {active && (
            <Stat
              label={`建設中（${getTierLabel(active.building_index)}）`}
              value={STAGE_LABELS[active.stage]}
            />
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <IsometricCity buildings={cityBuildings} />
        <MaterialsPanel
          commonAmount={commonRow?.amount ?? 0}
          dedicated={(dedicatedRows ?? []).map((d) => ({
            slot_position: d.slot_position as SlotPosition,
            amount: d.amount,
          }))}
          slotLabels={slotLabels}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[11px] text-[var(--bp-text-faint)]">{label}</p>
      <p className="font-bold" style={{ fontFamily: "var(--font-mono)" }}>
        {value}
      </p>
    </div>
  );
}
