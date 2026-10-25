import { relLuminance, type RGB } from "./color";

export function extractPalette(source: HTMLCanvasElement, k = 7): RGB[] {
  const S = 72;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, S, S);
  const d = ctx.getImageData(0, 0, S, S).data;

  const pts: RGB[] = [];
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    pts.push({ r: d[i], g: d[i + 1], b: d[i + 2] });
  }
  if (pts.length === 0) return [];

  const sorted = [...pts].sort((a, b) => relLuminance(a) - relLuminance(b));
  let centers: RGB[] = Array.from({ length: k }, (_, i) => {
    const idx = Math.min(sorted.length - 1, Math.floor(((i + 0.5) / k) * sorted.length));
    return { ...sorted[idx] };
  });

  for (let iter = 0; iter < 14; iter++) {
    const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (const p of pts) {
      let bi = 0;
      let bd = Infinity;
      for (let i = 0; i < k; i++) {
        const dr = p.r - centers[i].r;
        const dg = p.g - centers[i].g;
        const db = p.b - centers[i].b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bd) {
          bd = dist;
          bi = i;
        }
      }
      const s = sums[bi];
      s.r += p.r;
      s.g += p.g;
      s.b += p.b;
      s.n++;
    }
    centers = sums.map((s, i) =>
      s.n ? { r: Math.round(s.r / s.n), g: Math.round(s.g / s.n), b: Math.round(s.b / s.n) } : centers[i]
    );
  }

  const out: RGB[] = [];
  for (const c of centers) {
    if (!out.some((o) => Math.abs(o.r - c.r) + Math.abs(o.g - c.g) + Math.abs(o.b - c.b) < 18)) {
      out.push(c);
    }
  }
  return out.sort((a, b) => relLuminance(b) - relLuminance(a));
}