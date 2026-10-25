# setup.ps1 — ChromAssist full project setup
# Run from project root: powershell -ExecutionPolicy Bypass -File .\setup.ps1

$ErrorActionPreference = 'Stop'

function Write-File {
    param([string]$Path, [string]$Content)
    $full = Join-Path (Get-Location) $Path
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [System.IO.File]::WriteAllText($full, $Content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  [OK] $Path" -ForegroundColor Green
}

New-Item -ItemType Directory -Force -Path src, src\lib, src\components | Out-Null

# ============ CONFIG FILES ============
Write-Host "`n=== Config files ===" -ForegroundColor Cyan

Write-File "package.json" @'
{
  "name": "chromassist",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently -k -n api,web -c magenta,cyan \"npm:dev:server\" \"npm:dev:client\"",
    "dev:client": "vite --port=3000 --host=0.0.0.0",
    "dev:server": "tsx watch server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=esm --outfile=server.js --external:express --external:@google/genai",
    "start": "node server.js",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^8.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "autoprefixer": "^10.4.21",
    "concurrently": "^9.1.0",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.3.3",
    "tsx": "^4.21.0",
    "typescript": "^7.0.2"
  }
}
'@

Write-File "metadata.json" @'
{
  "name": "ChromAssist — AI-Based Color Vision Assistance System",
  "description": "Browser-based color vision assistive application featuring interactive image region color detection, CVD profile recoloring, Daltonization preview, AI descriptions, and academic mini-project documentation.",
  "requestFramePermissions": ["camera"],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}
'@

Write-File "vite.config.ts" @'
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
'@

Write-File ".env.example" @'
# GEMINI_API_KEY: Required for server-side Gemini calls.
# Get a key at https://aistudio.google.com/apikey
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
APP_URL="http://localhost:3000"
'@

Write-File ".gitignore" @'
node_modules
dist
server.js
.env
.env.local
.env.*.local
.DS_Store
*.log
.vite
'@

Write-File "README.md" @'
# ChromAssist

> Browser-based assistive tool for color-vision deficiency.

Live simulation · Daltonization enhancement · pixel identification · WCAG contrast checks · CIEDE2000 confusable-pair detection · voice descriptions · voice commands · AI image explanations.

## Features

- 4 CVD profiles with continuous severity slider — protanopia, deuteranopia, tritanopia, achromatopsia
- Three render modes — Original, Simulate, Enhance (Daltonization)
- Side-by-side compare between original and processed
- Pixel-accurate magnifier on hover; keyboard cursor for accessibility
- Color identification — hex, RGB, HSL, closest named color (CIE Lab, 120-entry corpus)
- Contrast checker — WCAG 2.1 AA / AAA against black and white
- Pair checker — CIEDE2000 distance under each CVD profile to catch confusable pairs
- Voice output — speaks color descriptions and AI explanations
- Voice commands — hands-free control ("simulate", "enhance", "describe", "contrast")
- Ask AI — Gemini describes which elements are confusing for your profile and how to fix them
- In-app documentation — full mini-project write-up

Everything except the AI call runs client-side. Images never leave the browser unless you click Ask AI.

## Run locally

Prerequisites: Node.js 20+

    git clone <your-repo>
    cd chromassist
    npm install
    cp .env.example .env.local
    # edit .env.local and set GEMINI_API_KEY
    npm run dev

- Client: http://localhost:3000
- API: http://localhost:3001

## Build & deploy

    npm run build
    npm start

Deploys cleanly to Cloud Run, Fly.io, Railway, or any Node host.

## References

- Machado, Oliveira & Fernandes (2009). A physiologically-based model for simulation of color vision deficiency. IEEE TVCG 15(6).
- Sharma, Wu & Dalal (2005). The CIEDE2000 color-difference formula. Color Res. & App. 30(1).
- W3C (2018). WCAG 2.1 — Success Criterion 1.4.3.

## License

MIT
'@

Write-File "server.ts" @'
import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[chromassist] GEMINI_API_KEY not set — /api/describe will fail. Add it to .env.local');
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const app = express();
app.use(express.json({ limit: '25mb' }));

const CVD_NAMES: Record<string, string> = {
  protanopia: 'protanopia (red-blind)',
  deuteranopia: 'deuteranopia (green-blind)',
  tritanopia: 'tritanopia (blue-blind)',
  achromatopsia: 'achromatopsia (monochromacy)',
};

app.post('/api/describe', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }
    const { imageBase64, mimeType, cvd, severity, hex, name } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      cvd?: string;
      severity?: number;
      hex?: string;
      name?: string;
    };

    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

    const profile = CVD_NAMES[cvd ?? ''] ?? 'color vision deficiency';
    const sev = typeof severity === 'number' ? Math.round(severity * 100) : 100;
    const pick = hex ? `They last picked ${hex}${name ? ` (${name})` : ''}.` : '';

    const prompt = `You are an accessibility assistant for someone with ${profile} at ${sev}% severity. ${pick}

Look at the attached image and reply in 2-3 short sentences:
1. Which specific elements or color pairs in this image are likely to look confusing or identical for this user.
2. One concrete, actionable suggestion to tell them apart (e.g. use the label text, shape, or position — not just color).

Be specific about what is actually in the image. Do not include disclaimers. Do not say "I can see". Do not use bullet points.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || 'image/png', data: imageBase64 } },
          ],
        },
      ],
    });

    const text = response.text?.trim() || 'No description was returned.';
    res.json({ text });
  } catch (err) {
    console.error('[chromassist] /api/describe failed:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, gemini: !!apiKey });
});

const dist = path.join(__dirname, 'dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(dist, 'index.html'), (err) => {
    if (err) res.status(404).end();
  });
});

app.listen(PORT, () => {
  console.log(`[chromassist] API on http://localhost:${PORT} (gemini: ${apiKey ? 'ready' : 'missing key'})`);
});
'@

# ============ LIB FILES ============
Write-Host "`n=== Lib files ===" -ForegroundColor Cyan

Write-File "src/lib/names.ts" @'
export type Named = { name: string; hex: string };

const RAW = `
000000 black
0a0a0f ink
1c1c28 graphite
2f2f3f slate
4f4f5f irongray
696969 dimgray
808080 gray
a9a9a9 darkgray
c0c0c0 silver
d3d3d3 lightgray
dcdcdc gainsboro
f5f5f5 whitesmoke
ffffff white
4d0000 oxblood
800000 maroon
8b0000 darkred
a52a2a brown
b22222 firebrick
c0392b brick
dc143c crimson
e74c3c vermilion
ff0000 red
ff4500 orangered
ff6347 tomato
fa8072 salmon
ffa07a lightsalmon
ff7f50 coral
5c3a21 coffee
8b4513 saddlebrown
a0522d sienna
d2691e chocolate
cd853f peru
f4a460 sandybrown
deb887 burlywood
d2b48c tan
f5deb3 wheat
b8860b darkgoldenrod
daa520 goldenrod
ffd700 gold
f0e68c khaki
ffff00 yellow
fffacd lemonchiffon
556b2f darkolivegreen
6b8e23 olive
808000 olive
9acd32 yellowgreen
7fff00 chartreuse
adff2f greenyellow
32cd32 limegreen
00ff00 lime
008000 green
006400 darkgreen
228b22 forestgreen
2e8b57 seagreen
3cb371 mediumseagreen
00fa9a mediumspringgreen
00ff7f springgreen
7fffd4 aquamarine
40e0d0 turquoise
48d1cc mediumturquoise
00ced1 darkturquoise
20b2aa lightseagreen
008080 teal
008b8b darkcyan
00ffff cyan
e0ffff lightcyan
afeeee paleturquoise
b0e0e6 powderblue
5f9ea0 cadetblue
4682b4 steelblue
6495ed cornflowerblue
4169e1 royalblue
0000cd mediumblue
0000ff blue
00008b darkblue
000080 navy
191970 midnightblue
483d8b darkslateblue
6a5acd slateblue
7b68ee mediumslateblue
8a2be2 blueviolet
4b0082 indigo
9400d3 darkviolet
9932cc darkorchid
800080 purple
8b008b darkmagenta
ff00ff magenta
ba55d3 mediumorchid
da70d6 orchid
ee82ee violet
dda0dd plum
d8bfd8 thistle
ff69b4 hotpink
ff1493 deeppink
ffc0cb pink
ffb6c1 lightpink
fffafa snow
fffff0 ivory
f5f5dc beige
faf0e6 linen
fdf5e6 oldlace
fff8dc cornsilk
ffebcd blanchedalmond
ffe4c4 bisque
ffdead navajowhite
ffe4b5 moccasin
ffdab9 peachpuff
ffefd5 papayawhip
faebd7 antiquewhite
fff5ee seashell
ffe4e1 mistyrose
fff0f5 lavenderblush
fffaf0 floralwhite
f8f8ff ghostwhite
f0f8ff aliceblue
f0ffff azure
f0fff0 honeydew
f5fffa mintcream
e6e6fa lavender
`;

export const NAMED_COLORS: Named[] = RAW.trim()
  .split("\n")
  .map((line) => {
    const [hex, name] = line.trim().split(/\s+/);
    return { hex: `#${hex}`, name };
  });
'@

Write-File "src/lib/color.ts" @'
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
'@

Write-File "src/lib/palette.ts" @'
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
'@

Write-File "src/lib/voice.ts" @'
export const speechOutputSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string) {
  if (!speechOutputSupported() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.03;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /Google UK English Female|Samantha|Microsoft Aria|Zira|Karen/i.test(v.name)) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("en"));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  } catch {
    /* no-op */
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* no-op */
  }
}

export type Recognizer = {
  supported: boolean;
  start: () => void;
  stop: () => void;
};

export function createRecognizer(
  onResult: (transcript: string) => void,
  onListeningChange: (listening: boolean) => void
): Recognizer {
  const w = window as unknown as {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) return { supported: false, start: () => {}, stop: () => {} };

  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = "en-US";
  rec.onstart = () => onListeningChange(true);
  rec.onend = () => onListeningChange(false);
  rec.onerror = () => onListeningChange(false);
  rec.onresult = (e: any) => {
    const last = e.results[e.results.length - 1];
    if (last?.isFinal) onResult(String(last[0].transcript).toLowerCase().trim());
  };

  return {
    supported: true,
    start() {
      try {
        rec.start();
      } catch {
        /* already started */
      }
    },
    stop() {
      try {
        rec.stop();
      } catch {
        /* no-op */
      }
    },
  };
}
'@

Write-File "src/lib/ai.ts" @'
import type { CVDType, RGB } from './color';
import { closestName, hexOf } from './color';

async function imageToBase64(src: string): Promise<{ base64: string; mimeType: string }> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('Failed to load image'));
    img.src = src;
  });

  const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);

  const dataUrl = c.toDataURL('image/png');
  return { base64: dataUrl.split(',')[1], mimeType: 'image/png' };
}

export async function describeImageWithAI(args: {
  imageSrc: string;
  cvd: CVDType;
  severity: number;
  picked: RGB | null;
}): Promise<string> {
  const { base64, mimeType } = await imageToBase64(args.imageSrc);

  const payload = {
    imageBase64: base64,
    mimeType,
    cvd: args.cvd,
    severity: args.severity,
    hex: args.picked ? hexOf(args.picked) : undefined,
    name: args.picked ? closestName(args.picked).name : undefined,
  };

  const res = await fetch('/api/describe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server responded ${res.status}`);
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}
'@

Write-Host "`n=== All files written. Next steps:" -ForegroundColor Cyan
Write-Host "  npm install" -ForegroundColor White
Write-Host "  cp .env.example .env.local    (then paste your Gemini key inside)" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""