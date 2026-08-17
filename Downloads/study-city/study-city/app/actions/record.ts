"use server";

import { createClient } from "@/lib/supabase/server";
import {
  calculateMaterialGain,
  getRequiredCommonForBuilding,
  stageForInvested,
  type SlotPosition,
} from "@/lib/recipes";
import { revalidatePath } from "next/cache";

export interface RecordResult {
  ok: boolean;
  error?: string;
  commonGain?: number;
  dedicatedGain?: number;
  fullRateMinutes?: number;
  overLimitMinutes?: number;
  buildingStage?: number;
  buildingCompleted?: boolean;
}

const QUICK_MINUTES_MAX = 600;

/**
 * スロットに対して学習時間を記録し、共通資材・専用資材を加算、
 * 現在建設中の建物の進捗（stage）を更新する。
 */
export async function recordStudyTime(slotId: string, minutes: number): Promise<RecordResult> {
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > QUICK_MINUTES_MAX) {
    return { ok: false, error: "記録できるのは1〜600分の範囲です。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "ログインが必要です。" };
  }

  // スロットの所有確認 + position取得
  const { data: slot, error: slotError } = await supabase
    .from("slots")
    .select("id, position, user_id")
    .eq("id", slotId)
    .single();

  if (slotError || !slot || slot.user_id !== user.id) {
    return { ok: false, error: "スロットが見つかりません。" };
  }
  const slotPosition = slot.position as SlotPosition;

  // 今日すでに記録済みの合計分数（全スロット合算）を取得 → 逓減判定に使う
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: todayRecords, error: todayError } = await supabase
    .from("study_records")
    .select("minutes")
    .eq("user_id", user.id)
    .eq("recorded_on", todayStr);

  if (todayError) {
    return { ok: false, error: "本日の記録の取得に失敗しました。" };
  }

  const minutesAlreadyToday = (todayRecords ?? []).reduce((sum, r) => sum + r.minutes, 0);
  const { commonGain, dedicatedGain, fullRateMinutes, overLimitMinutes } = calculateMaterialGain(
    minutesAlreadyToday,
    minutes
  );

  // 1. 記録ログを挿入
  const { error: insertError } = await supabase.from("study_records").insert({
    user_id: user.id,
    slot_id: slotId,
    minutes,
    recorded_on: todayStr,
    common_gain: commonGain,
    dedicated_gain: dedicatedGain,
  });
  if (insertError) {
    return { ok: false, error: "記録の保存に失敗しました。" };
  }

  // 2. 共通資材を加算（upsert）
  const { data: commonRow } = await supabase
    .from("material_common")
    .select("amount")
    .eq("user_id", user.id)
    .maybeSingle();

  await supabase
    .from("material_common")
    .upsert({ user_id: user.id, amount: (commonRow?.amount ?? 0) + commonGain });

  // 3. 専用資材を加算（upsert）
  const { data: dedicatedRow } = await supabase
    .from("material_dedicated")
    .select("amount")
    .eq("user_id", user.id)
    .eq("slot_position", slotPosition)
    .maybeSingle();

  await supabase.from("material_dedicated").upsert({
    user_id: user.id,
    slot_position: slotPosition,
    amount: (dedicatedRow?.amount ?? 0) + dedicatedGain,
  });

  // 4. 現在建設中の建物を取得（無ければ新規作成）
  const { data: activeBuilding } = await supabase
    .from("buildings")
    .select("id, building_index, stage, common_invested")
    .eq("user_id", user.id)
    .lt("stage", 3)
    .order("building_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  let building = activeBuilding;
  if (!building) {
    const { data: latest } = await supabase
      .from("buildings")
      .select("building_index")
      .eq("user_id", user.id)
      .order("building_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextIndex = (latest?.building_index ?? 0) + 1;
    const { data: created, error: createError } = await supabase
      .from("buildings")
      .insert({ user_id: user.id, building_index: nextIndex, stage: 0, common_invested: 0 })
      .select("id, building_index, stage, common_invested")
      .single();

    if (createError || !created) {
      return { ok: false, error: "建物の初期化に失敗しました。" };
    }
    building = created;
  }

  // 5. 建物の進捗（共通資材投入量）を更新し、stageを再計算
  const newInvested = building.common_invested + commonGain;
  const newStage = stageForInvested(building.building_index, newInvested);
  const required = getRequiredCommonForBuilding(building.building_index);
  const cappedInvested = Math.min(newInvested, required);
  const buildingCompleted = newStage >= 3 && building.stage < 3;

  await supabase
    .from("buildings")
    .update({
      common_invested: cappedInvested,
      stage: newStage,
      completed_at: buildingCompleted ? new Date().toISOString() : undefined,
    })
    .eq("id", building.id);

  // 6. その建物の装飾内訳（どのスロットの専用資材をどれだけ使ったか）を更新
  const { data: decoRow } = await supabase
    .from("building_decorations")
    .select("amount")
    .eq("building_id", building.id)
    .eq("slot_position", slotPosition)
    .maybeSingle();

  await supabase.from("building_decorations").upsert({
    building_id: building.id,
    slot_position: slotPosition,
    amount: (decoRow?.amount ?? 0) + dedicatedGain,
  });

  revalidatePath("/record");
  revalidatePath("/city");

  return {
    ok: true,
    commonGain,
    dedicatedGain,
    fullRateMinutes,
    overLimitMinutes,
    buildingStage: newStage,
    buildingCompleted,
  };
}
