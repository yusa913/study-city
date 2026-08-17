"use server";

import { createClient } from "@/lib/supabase/server";
import { SLOT_POSITIONS, type SlotPosition } from "@/lib/recipes";
import { revalidatePath } from "next/cache";

export async function createSlot(position: SlotPosition, label: string) {
  if (!SLOT_POSITIONS.includes(position)) {
    return { ok: false, error: "不正なスロット位置です。" };
  }
  const trimmed = label.trim();
  if (!trimmed || trimmed.length > 30) {
    return { ok: false, error: "ラベルは1〜30文字で入力してください。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です。" };

  const { error } = await supabase
    .from("slots")
    .insert({ user_id: user.id, position, label: trimmed });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "そのスロットはすでに使われています。" };
    }
    return { ok: false, error: "スロットの作成に失敗しました。" };
  }

  revalidatePath("/record");
  return { ok: true };
}

export async function deleteSlot(slotId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です。" };

  const { error } = await supabase.from("slots").delete().eq("id", slotId).eq("user_id", user.id);
  if (error) return { ok: false, error: "削除に失敗しました。" };

  revalidatePath("/record");
  return { ok: true };
}
