import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/record");

  return (
    <div className="mx-auto max-w-5xl px-5 py-20">
      <p className="label-eyebrow mb-4">STUDY MINUTES → BUILDING MATERIALS</p>
      <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
        勉強した分だけ、
        <br />
        <span className="text-[var(--bp-amber)]">自分の街</span>が建っていく。
      </h1>
      <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-[var(--bp-text-muted)]">
        記録した学習時間は、その日のうちに「建材」へ変換されます。
        科目ごとに土台・骨組み・外装・完成と段階的に建物が育ち、
        気づけば一人称の街ができあがっている——そんな学習記録アプリです。
      </p>

      <div className="mt-9 flex gap-3">
        <Link href="/login" className="btn-primary px-5 py-3 text-sm">
          記録をはじめる
        </Link>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        <BlueprintCard
          index="01"
          title="ワンタップ記録"
          body="科目スロットを選んでタップするだけ。複雑な入力は要りません。"
        />
        <BlueprintCard
          index="02"
          title="共通資材と専用資材"
          body="どのスロットで記録しても街の進行は止まらず、登録数が多いほど装飾が多彩に。"
        />
        <BlueprintCard
          index="03"
          title="4段階の建設演出"
          body="土台→骨組み→外装→完成。1棟の完成を待たずに達成感を刻めます。"
        />
      </div>

      {/* シグネチャー：設計図が実体化していく様子をミニマムに表現 */}
      <div className="panel mt-16 overflow-hidden p-6">
        <p className="label-eyebrow mb-4">BLUEPRINT → BUILT</p>
        <svg viewBox="0 0 640 160" className="h-auto w-full" role="img" aria-label="設計図から建物が完成していく様子">
          {[0, 1, 2, 3].map((stage) => {
            const x = 40 + stage * 150;
            const opacityWall = stage / 3;
            return (
              <g key={stage} transform={`translate(${x}, 20)`}>
                <rect
                  x="0"
                  y="60"
                  width="90"
                  height="70"
                  fill="none"
                  stroke="var(--bp-cyan)"
                  strokeOpacity="0.5"
                  strokeDasharray={stage < 3 ? "4 4" : "0"}
                />
                <rect
                  x="0"
                  y={60 + 70 * (1 - opacityWall)}
                  width="90"
                  height={70 * opacityWall}
                  fill="var(--bp-amber)"
                  fillOpacity={0.25 + opacityWall * 0.55}
                />
                {stage >= 2 && (
                  <polygon
                    points="-6,60 45,30 96,60"
                    fill={stage === 3 ? "var(--bp-amber)" : "none"}
                    stroke="var(--bp-cyan)"
                    strokeOpacity="0.6"
                  />
                )}
                <text
                  x="45"
                  y="150"
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--bp-text-faint)"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {["土台", "骨組み", "外装", "完成"][stage]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function BlueprintCard({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-bold text-[var(--bp-amber)]" style={{ fontFamily: "var(--font-mono)" }}>
        {index}
      </p>
      <h3 className="mt-2 font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--bp-text-muted)]">{body}</p>
    </div>
  );
}
