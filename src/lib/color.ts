import { NAMED_COLORS } from "./names";

export type RGB = { r: number; g: number; b: number };
export type CVDType = "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";
export type ViewMode = "original" | "simulate" | "daltonize";

export const CVD_TYPES: CVDType[] = ["protanopia", "deuteranopia", "tritanopia", "achromatopsia"];

export const CVD_LABELS: Record<CVDType, string> = {
  protanopia: "Protanopia",
  deuteranopia: "Deuteranopia",
  tritanopia: "Tritanopia",
  achromatopsia: "Achromatopsia",
};

export const CVD_SHORT: Record<CVDType, string> = {
  protanopia: "Red-blind",
  deuteranopia: "Green-blind",
  tritanopia: "Blue-blind",
  achromatopsia: "Monochromacy",
};

export const CVD_PREVALENCE: Record<CVDType, string> = {
  protanopia: "~1% of men",
  deuteranopia: "~5% of men",
  tritanopia: "~0.01% of people",
  achromatopsia: "~0.003% of people",
};

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

const srgbToLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const linearToSrgb = (v: number) => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return clamp255(c * 255);
};

const S2L = new Float32Array(256);
for (let i = 0; i < 256; i++) S2L[i] = srgbToLinear(i);
const L2S = new Uint8ClampedArray(4097);
for (let i = 0; i <= 4096; i++) L2S[i] = linearToSrgb(i / 4096);
const l2s = (v: number) => L2S[v <= 0 ? 0 : v >= 1 ? 4096 : (v * 4096) | 0];

const IDENTITY = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const FULL_MATRIX: Record<CVDType, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
  achromatopsia: [
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
  ],
};

const matrixCache = new Map<string, number[][]>();

export function matrixFor(cvd: CVDType, severity: number): number[][] {
  const key = `${cvd}:${severity.toFixed(3)}`;
  const hit = matrixCache.get(key);
  if (hit) return hit;
  const m = FULL_MATRIX[cvd];
  const s = Math.max(0, Math.min(1, severity));
  const out = m.map((row, i) => row.map((v, j) => IDENTITY[i][j] + (v - IDENTITY[i][j]) * s));
  matrixCache.set(key, out);
  return out;
}

const DALTONIZE: Record<CVDType, number[][]> = {
  protanopia: [
    [0, 0, 0],
    [0.7, 1, 0],
    [0.7, 0, 1],
  ],
  deuteranopia: [
    [1, 0.7, 0],
    [0, 0, 0],
    [0, 0.7, 1],
  ],
  tritanopia: [
    [1, 0, 0.7],
    [0, 1, 0.7],
    [0, 0, 0],
  ],
  achromatopsia: [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ],
};

export function simulateRgb(rgb: RGB, cvd: CVDType, severity = 1): RGB {
  const M = matrixFor(cvd, severity);
  const lr = S2L[rgb.r],
    lg = S2L[rgb.g],
    lb = S2L[rgb.b];
  return {
    r: l2s(M[0][0] * lr + M[0][1] * lg + M[0][2] * lb),
    g: l2s(M[1][0] * lr + M[1][1] * lg + M[1][2] * lb),
    b: l2s(M[2][0] * lr + M[2][1] * lg + M[2][2] * lb),
  };
}

export function daltonizeRgb(rgb: RGB, cvd: CVDType, strength = 1): RGB {
  const sim = simulateRgb(rgb, cvd, 1);
  const D = DALTONIZE[cvd];
  const er = rgb.r - sim.r,
    eg = rgb.g - sim.g,
    eb = rgb.b - sim.b;
  const s = Math.max(0, Math.min(1, strength));
  return {
    r: clamp255(rgb.r + s * (D[0][0] * er + D[0][1] * eg + D[0][2] * eb)),
    g: clamp255(rgb.g + s * (D[1][0] * er + D[1][1] * eg + D[1][2] * eb)),
    b: clamp255(rgb.b + s * (D[2][0] * er + D[2][1] * eg + D[2][2] * eb)),
  };
}

export function transformImageData(
  data: Uint8ClampedArray,
  mode: ViewMode,
  cvd: CVDType,
  severity: number
): void {
  if (mode === "original") return;

  if (mode === "simulate") {
    const M = matrixFor(cvd, severity);
    const [a, b, c] = M[0];
    const [d, e, f] = M[1];
    const [g, h, i] = M[2];
    for (let p = 0; p < data.length; p += 4) {
      const lr = S2L[data[p]],
        lg = S2L[data[p + 1]],
        lb = S2L[data[p + 2]];
      data[p] = l2s(a * lr + b * lg + c * lb);
      data[p + 1] = l2s(d * lr + e * lg + f * lb);
      data[p + 2] = l2s(g * lr + h * lg + i * lb);
    }
    return;
  }

  const M = FULL_MATRIX[cvd];
  const D = DALTONIZE[cvd];
  const s = Math.max(0, Math.min(1, severity));
  for (let p = 0; p < data.length; p += 4) {
    const r = data[p],
      g = data[p + 1],
      b = data[p + 2];
    const lr = S2L[r],
      lg = S2L[g],
      lb = S2L[b];
    const sr = l2s(M[0][0] * lr + M[0][1] * lg + M[0][2] * lb);
    const sg = l2s(M[1][0] * lr + M[1][1] * lg + M[1][2] * lb);
    const sb = l2s(M[2][0] * lr + M[2][1] * lg + M[2][2] * lb);
    const er = r - sr,
      eg = g - sg,
      eb = b - sb;
    data[p] = clamp255(r + s * (D[0][0] * er + D[0][1] * eg + D[0][2] * eb));
    data[p + 1] = clamp255(g + s * (D[1][0] * er + D[1][1] * eg + D[1][2] * eb));
    data[p + 2] = clamp255(b + s * (D[2][0] * er + D[2][1] * eg + D[2][2] * eb));
  }
}

export const hexOf = ({ r, g, b }: RGB) =>
  "#" + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, "0")).join("").toUpperCase();

export const rgbOf = ({ r, g, b }: RGB) => `rgb(${r}, ${g}, ${b})`;

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function hslOf({ r, g, b }: RGB) {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0,
    s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      default:
        h = ((rn - gn) / d + 4) * 60;
    }
  }
  return { h, s, l };
}

export function relLuminance({ r, g, b }: RGB): number {
  return 0.2126 * S2L[r] + 0.7152 * S2L[g] + 0.0722 * S2L[b];
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = relLuminance(a),
    lb = relLuminance(b);
  const hi = Math.max(la, lb),
    lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export function readableOn(bg: RGB): RGB {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 8, g: 8, b: 12 };
  return contrastRatio(bg, white) >= contrastRatio(bg, black) ? white : black;
}

const XN = 0.95047,
  YN = 1.0,
  ZN = 1.08883;

const fLab = (t: number) => (t > 0.008856451679035631 ? Math.cbrt(t) : t / 0.12841854934601665 + 4 / 29);

export function toLab({ r, g, b }: RGB) {
  const lr = S2L[r],
    lg = S2L[g],
    lb = S2L[b];
  const X = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const Y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const Z = 0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb;
  const fx = fLab(X / XN),
    fy = fLab(Y / YN),
    fz = fLab(Z / ZN);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const P25_7 = Math.pow(25, 7);

export function deltaE2000(c1: RGB, c2: RGB): number {
  const A = toLab(c1);
  const B = toLab(c2);

  const C1 = Math.hypot(A.a, A.b);
  const C2 = Math.hypot(B.a, B.b);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + P25_7)));

  const a1p = (1 + G) * A.a;
  const a2p = (1 + G) * B.a;
  const C1p = Math.hypot(a1p, A.b);
  const C2p = Math.hypot(a2p, B.b);

  const hp = (b: number, ap: number) => {
    if (b === 0 && ap === 0) return 0;
    const h = Math.atan2(b, ap) * DEG;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hp(A.b, a1p);
  const h2p = hp(B.b, a2p);

  const dLp = B.L - A.L;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) dhp = 0;
  else if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
  else if (h2p - h1p > 180) dhp = h2p - h1p - 360;
  else dhp = h2p - h1p + 360;

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * RAD);

  const Lbarp = (A.L + B.L) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let hbarp: number;
  if (C1p * C2p === 0) hbarp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2;
  else if (h1p + h2p < 360) hbarp = (h1p + h2p + 360) / 2;
  else hbarp = (h1p + h2p - 360) / 2;

  const T =
    1 -
    0.17 * Math.cos((hbarp - 30) * RAD) +
    0.24 * Math.cos(2 * hbarp * RAD) +
    0.32 * Math.cos((3 * hbarp + 6) * RAD) -
    0.2 * Math.cos((4 * hbarp - 63) * RAD);

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Rc = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + P25_7));
  const Sl = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(2 * dTheta * RAD) * Rc;

  return Math.sqrt(
    Math.pow(dLp / Sl, 2) +
      Math.pow(dCp / Sc, 2) +
      Math.pow(dHp / Sh, 2) +
      Rt * (dCp / Sc) * (dHp / Sh)
  );
}

let namedLabs: { name: string; hex: string; lab: ReturnType<typeof toLab> }[] | null = null;

export function closestName(rgb: RGB): { name: string; hex: string; distance: number } {
  if (!namedLabs) {
    namedLabs = NAMED_COLORS.map((c) => ({ ...c, lab: toLab(hexToRgb(c.hex)) }));
  }
  const lab = toLab(rgb);
  let best = namedLabs[0];
  let bestD = Infinity;
  for (const c of namedLabs) {
    const d = Math.hypot(c.lab.L - lab.L, c.lab.a - lab.a, c.lab.b - lab.b);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return { name: best.name, hex: best.hex, distance: Math.round(bestD) };
}

export function hueName(h: number): string {
  const names = [
    "red", "vermilion", "orange", "amber", "yellow", "chartreuse",
    "green", "emerald", "teal", "cyan", "azure", "blue",
    "indigo", "violet", "purple", "magenta", "rose", "crimson",
  ];
  const i = Math.round(((h % 360) / 360) * names.length) % names.length;
  return names[i];
}

export function describeColor(rgb: RGB, cvd: CVDType, severity: number): string {
  const { name } = closestName(rgb);
  const { h, s, l } = hslOf(rgb);
  const hex = hexOf(rgb);
  const parts: string[] = [];

  parts.push(`${hex}, closest to ${name}.`);
  if (s < 0.08) {
    parts.push(
      l < 0.2 ? "A near-black neutral." : l > 0.85 ? "A near-white neutral." : "A grey with almost no hue."
    );
  } else {
    parts.push(`${Math.round(s * 100)} percent saturation, ${Math.round(l * 100)} percent lightness.`);
  }

  const vsBlack = contrastRatio(rgb, { r: 0, g: 0, b: 0 });
  const vsWhite = contrastRatio(rgb, { r: 255, g: 255, b: 255 });
  parts.push(
    `Contrast ${vsBlack.toFixed(1)} to 1 on black and ${vsWhite.toFixed(1)} to 1 on white.`
  );

  if (cvd !== "achromatopsia") {
    const seen = simulateRgb(rgb, cvd, Math.max(severity, 0.2));
    parts.push(`Under ${CVD_LABELS[cvd].toLowerCase()} it reads as ${closestName(seen).name}.`);
  } else {
    const lum = relLuminance(rgb);
    parts.push(`In full monochromacy it reads as ${lum < 0.18 ? "dark" : lum < 0.5 ? "mid" : "light"} grey.`);
  }

  return parts.join(" ");
}

export const isLight = (rgb: RGB) => relLuminance(rgb) > 0.42;

export function confusable(a: RGB, b: RGB, cvd: CVDType, severity = 1): boolean {
  return deltaE2000(simulateRgb(a, cvd, severity), simulateRgb(b, cvd, severity)) < 10;
}