/**
 * 建設レシピ・建材テーマの設定データ。
 * 企画書 5.3「コード変更なしにバランス調整できる」の方針に沿って、
 * ロジックとは分離した「設定」としてこのファイルに集約する。
 * 将来的にはこのままJSONへ切り出し、DBやCMSで管理してもよい。
 */

export type SlotPosition = "A" | "B" | "C" | "D" | "E" | "F";

export const SLOT_POSITIONS: SlotPosition[] = ["A", "B", "C", "D", "E", "F"];

export interface SlotTheme {
  position: SlotPosition;
  /** 建材テーマ名（企画書3.2の例に準拠・拡張） */
  themeName: string;
  /** テクスチャの雰囲気を表す短い説明 */
  description: string;
  /** UI表示用のアクセントカラー（ブループリント配色に馴染む彩度） */
  color: string;
  colorSoft: string;
}

export const SLOT_THEMES: Record<SlotPosition, SlotTheme> = {
  A: {
    position: "A",
    themeName: "石造",
    description: "重厚な石積みの外壁。序盤から存在感のある質感。",
    color: "#E8748B",
    colorSoft: "#E8748B33",
  },
  B: {
    position: "B",
    themeName: "木造",
    description: "温かみのある木材の外装と緑の装飾。",
    color: "#6FAE6A",
    colorSoft: "#6FAE6A33",
  },
  C: {
    position: "C",
    themeName: "近代",
    description: "ガラスと鉄骨によるモダンな青の高層建築。",
    color: "#5B8DEF",
    colorSoft: "#5B8DEF33",
  },
  D: {
    position: "D",
    themeName: "れんが",
    description: "赤褐色のレンガ造り、下町らしい温もり。",
    color: "#D98E3F",
    colorSoft: "#D98E3F33",
  },
  E: {
    position: "E",
    themeName: "ガラス",
    description: "淡いティールのガラスファサード。",
    color: "#4FC1C7",
    colorSoft: "#4FC1C733",
  },
  F: {
    position: "F",
    themeName: "庭園石畳",
    description: "紫がかった石畳と庭園装飾。",
    color: "#9B7FD4",
    colorSoft: "#9B7FD433",
  },
};

/** 建物のフェーズ（企画書3.4）: 段階ごとの目安必要時間(分)レンジ */
export interface BuildingTier {
  fromIndex: number; // この棟数から
  toIndex: number | null; // この棟数まで（nullは無限）
  label: string;
  requiredMinutes: number; // 1棟完成(土台→完成)に必要な共通資材の目安量(=分)
}

export const BUILDING_TIERS: BuildingTier[] = [
  { fromIndex: 1, toIndex: 3, label: "序盤", requiredMinutes: 4 * 60 }, // 3〜5時間の中間値
  { fromIndex: 4, toIndex: 10, label: "中盤", requiredMinutes: 11.5 * 60 }, // 8〜15時間の中間値
  { fromIndex: 11, toIndex: null, label: "終盤・拡張", requiredMinutes: 25 * 60 }, // 20〜30時間の中間値
];

export function getRequiredCommonForBuilding(buildingIndex: number): number {
  const tier =
    BUILDING_TIERS.find(
      (t) => buildingIndex >= t.fromIndex && (t.toIndex === null || buildingIndex <= t.toIndex)
    ) ?? BUILDING_TIERS[BUILDING_TIERS.length - 1];
  return tier.requiredMinutes;
}

export function getTierLabel(buildingIndex: number): string {
  const tier =
    BUILDING_TIERS.find(
      (t) => buildingIndex >= t.fromIndex && (t.toIndex === null || buildingIndex <= t.toIndex)
    ) ?? BUILDING_TIERS[BUILDING_TIERS.length - 1];
  return tier.label;
}

/** 4段階: 0 土台 / 1 骨組み / 2 外装 / 3 完成。3回の閾値越えでstageが進む */
export const STAGE_LABELS = ["土台", "骨組み", "外装", "完成"] as const;

export function stageForInvested(buildingIndex: number, commonInvested: number): number {
  const required = getRequiredCommonForBuilding(buildingIndex);
  const ratio = commonInvested / required;
  if (ratio >= 1) return 3;
  if (ratio >= 2 / 3) return 2;
  if (ratio >= 1 / 3) return 1;
  return 0;
}

/**
 * 記録の不正抑止（企画書3.1）:
 * 1日の合計記録に軽い上限を設け、超過分は資材効率を逓減させる。
 */
export const DAILY_FULL_RATE_MINUTES = 240; // 1日4時間までは等倍
export const OVER_LIMIT_EFFICIENCY = 0.4; // 超過分は40%の資材効率

/**
 * 記録した分数から「共通資材」「専用資材」の獲得量を計算する。
 * @param minutesAlreadyToday その日、記録前までにすでに記録済みの合計分数（全スロット合算）
 * @param minutesToAdd 今回記録する分数
 */
export function calculateMaterialGain(minutesAlreadyToday: number, minutesToAdd: number) {
  const capRemaining = Math.max(0, DAILY_FULL_RATE_MINUTES - minutesAlreadyToday);
  const fullRateMinutes = Math.min(minutesToAdd, capRemaining);
  const overLimitMinutes = Math.max(0, minutesToAdd - fullRateMinutes);

  const gain = fullRateMinutes * 1 + overLimitMinutes * OVER_LIMIT_EFFICIENCY;

  return {
    commonGain: gain,
    dedicatedGain: gain,
    fullRateMinutes,
    overLimitMinutes,
  };
}
