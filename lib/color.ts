function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** 複数の色を重み付き平均でブレンドする（装飾内訳の可視化に使用） */
export function blendColors(entries: { color: string; weight: number }[], fallback = "#5c7196") {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) return fallback;

  let r = 0,
    g = 0,
    b = 0;
  for (const e of entries) {
    const rgb = hexToRgb(e.color);
    const w = e.weight / total;
    r += rgb.r * w;
    g += rgb.g * w;
    b += rgb.b * w;
  }
  return rgbToHex(r, g, b);
}

export function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 + amount;
  return rgbToHex(r * f, g * f, b * f);
}
