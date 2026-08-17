import { SLOT_THEMES, STAGE_LABELS, getRequiredCommonForBuilding, type SlotPosition } from "@/lib/recipes";
import { blendColors, shade } from "@/lib/color";

export interface CityBuilding {
  id: string;
  building_index: number;
  stage: number;
  common_invested: number;
  decorations: { slot_position: SlotPosition; amount: number }[];
}

const TILE_W = 96;
const TILE_H = 56;
const COLS = 5;
const MAX_WALL_H = 64;

function gridPosition(index: number) {
  // index: 0-based。5列のスネーク配置で「通り」らしさを出す
  const row = Math.floor(index / COLS);
  const inRowIndex = index % COLS;
  const col = row % 2 === 0 ? inRowIndex : COLS - 1 - inRowIndex;
  return { row, col };
}

export default function IsometricCity({ buildings }: { buildings: CityBuilding[] }) {
  if (buildings.length === 0) {
    return (
      <div className="panel flex min-h-[280px] items-center justify-center p-10 text-center">
        <p className="text-sm text-[var(--bp-text-muted)]">
          まだ建物がありません。記録ページで学習時間を記録すると、最初の建物の土台が組まれます。
        </p>
      </div>
    );
  }

  const rows = Math.ceil(buildings.length / COLS);
  const width = (COLS + rows) * (TILE_W / 2) + 120;
  const height = (COLS + rows) * (TILE_H / 2) + 160;
  const originX = (rows * TILE_W) / 2 + 40;
  const originY = 50;

  return (
    <div className="panel overflow-x-auto p-6">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto h-auto min-w-[560px] max-w-[900px]"
        role="img"
        aria-label="学習記録から建設された街の俯瞰図"
      >
        {/* ブループリントの地面グリッド */}
        <g opacity="0.35">
          {Array.from({ length: rows + COLS + 2 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={originX - i * (TILE_W / 2)}
              y1={originY + i * (TILE_H / 2)}
              x2={originX + (rows + 1) * (TILE_W / 2) - i * (TILE_W / 2)}
              y2={originY + (rows + 1) * (TILE_H / 2) + i * (TILE_H / 2)}
              stroke="var(--bp-grid-line)"
              strokeWidth="1"
            />
          ))}
        </g>

        {buildings.map((b) => {
          const { row, col } = gridPosition(b.building_index - 1);
          const cx = originX + (col - row) * (TILE_W / 2);
          const cy = originY + (col + row) * (TILE_H / 2);

          const blended = blendColors(
            b.decorations.map((d) => ({ color: SLOT_THEMES[d.slot_position].color, weight: d.amount })),
            "#4a5f85"
          );
          const required = getRequiredCommonForBuilding(b.building_index);
          const progressRatio = Math.min(1, b.common_invested / required);
          const wallH = 10 + (MAX_WALL_H - 10) * (b.stage === 0 ? 0.12 : b.stage / 3);
          const isLandmark = b.building_index >= 11;

          const top = cy - wallH;
          const halfW = TILE_W / 2;
          const halfH = TILE_H / 2;

          const roofPts = `${cx},${top - halfH} ${cx + halfW},${top} ${cx},${top + halfH} ${cx - halfW},${top}`;
          const leftPts = `${cx - halfW},${top} ${cx},${top + halfH} ${cx},${cy + halfH} ${cx - halfW},${cy}`;
          const rightPts = `${cx + halfW},${top} ${cx},${top + halfH} ${cx},${cy + halfH} ${cx + halfW},${cy}`;

          return (
            <g key={b.id}>
              <title>
                {`${b.building_index}棟目 ・ ${STAGE_LABELS[b.stage]} (${Math.round(progressRatio * 100)}%)`}
              </title>

              {/* 基礎（土台）は常に薄く表示 */}
              <polygon
                points={`${cx},${cy - halfH} ${cx + halfW},${cy} ${cx},${cy + halfH} ${cx - halfW},${cy}`}
                fill="none"
                stroke="var(--bp-cyan)"
                strokeOpacity="0.4"
                strokeDasharray={b.stage === 0 ? "3 3" : "0"}
              />

              {b.stage > 0 && (
                <>
                  <polygon points={leftPts} fill={shade(blended, -0.25)} />
                  <polygon points={rightPts} fill={shade(blended, -0.1)} />
                </>
              )}

              {b.stage >= 2 ? (
                <polygon points={roofPts} fill={blended} stroke={shade(blended, 0.25)} strokeWidth="1" />
              ) : (
                <polygon
                  points={roofPts}
                  fill="none"
                  stroke="var(--bp-cyan)"
                  strokeOpacity="0.55"
                  strokeDasharray="3 3"
                />
              )}

              {isLandmark && b.stage === 3 && (
                <circle cx={cx} cy={top - halfH - 6} r="3" fill="var(--bp-amber)" />
              )}

              {b.stage < 3 && (
                <rect
                  x={cx - 14}
                  y={cy + halfH + 4}
                  width="28"
                  height="4"
                  rx="2"
                  fill="var(--bp-navy-950)"
                  stroke="var(--bp-grid-line-strong)"
                />
              )}
              {b.stage < 3 && (
                <rect
                  x={cx - 14}
                  y={cy + halfH + 4}
                  width={28 * progressRatio}
                  height="4"
                  rx="2"
                  fill="var(--bp-amber)"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
