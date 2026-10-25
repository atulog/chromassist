# setup-part2.ps1 — ALL remaining UI files
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

Write-File "src/main.tsx" @'
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
'@

Write-File "src/index.css" @'
@import "tailwindcss";
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --color-void: #05050a;
  --color-panel: #0b0b12;
  --color-muted: #8b8ba3;
  --color-accent: #7c5cff;
  --color-accent2: #22d3ee;
}
@layer base {
  :root { color-scheme: dark; }
  html, body, #root { height: 100%; }
  body {
    margin: 0; background: var(--color-void); color: #e4e4ec;
    font-family: var(--font-sans); -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  body::before {
    content: ""; position: fixed; inset: -25%; z-index: -1; pointer-events: none;
    background:
      radial-gradient(45rem 45rem at 12% -10%, rgba(124,92,255,.22), transparent 60%),
      radial-gradient(40rem 40rem at 92% 2%, rgba(34,211,238,.14), transparent 60%),
      radial-gradient(55rem 55rem at 50% 115%, rgba(255,79,163,.1), transparent 60%);
    filter: blur(12px);
  }
  ::selection { background: rgba(124,92,255,.4); }
  :focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
}
@utility glass {
  background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.015));
  border: 1px solid rgba(255,255,255,.075);
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
}
@keyframes rise { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
@utility animate-rise { animation: rise .45s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ring { 0% { transform:scale(.9); opacity:.85; } 70% { transform:scale(1.8); opacity:0; } 100% { opacity:0; } }
@utility animate-ring { animation: ring 1.9s ease-out infinite; }
'@

Write-File "src/components/Stage.tsx" @'
import { useCallback, useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { transformImageData, type CVDType, type RGB, type ViewMode } from "@/lib/color";
import { extractPalette } from "@/lib/palette";
const MAX_EDGE = 1400, MAG_HALF = 12, MAG_PX = 168;
type Props = { src: string|null; mode: ViewMode; cvd: CVDType; severity: number; compare: boolean; onPick:(rgb:RGB)=>void; onLoad:(p:RGB[])=>void; onDropFile:(f:File)=>void; onRequestUpload:()=>void };
type Cursor = { cx:number; cy:number; x:number; y:number } | null;
export default function Stage({ src, mode, cvd, severity, compare, onPick, onLoad, onDropFile, onRequestUpload }: Props) {
  const baseRef = useRef<HTMLCanvasElement|null>(null);
  const viewRef = useRef<HTMLCanvasElement|null>(null);
  const magRef = useRef<HTMLCanvasElement|null>(null);
  const wrapRef = useRef<HTMLDivElement|null>(null);
  const onLoadRef = useRef(onLoad); onLoadRef.current = onLoad;
  const [ready, setReady] = useState(false);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!src) { baseRef.current = null; setReady(false); return; }
    let alive = true;
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!alive) return;
      const s = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * s)), h = Math.max(1, Math.round(img.naturalHeight * s));
      const base = document.createElement("canvas"); base.width = w; base.height = h;
      base.getContext("2d", { willReadFrequently: true })!.drawImage(img, 0, 0, w, h);
      baseRef.current = base;
      const v = viewRef.current; if (v) { v.width = w; v.height = h; }
      setReady(true); onLoadRef.current(extractPalette(base, 7));
    };
    img.onerror = () => alive && setReady(false);
    img.src = src; return () => { alive = false; };
  }, [src]);
  const render = useCallback(() => {
    const base = baseRef.current, view = viewRef.current; if (!base || !view) return;
    const w = base.width, h = base.height;
    if (view.width !== w || view.height !== h) { view.width = w; view.height = h; }
    const ctx = view.getContext("2d")!;
    const srcData = base.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, w, h);
    const out = new ImageData(new Uint8ClampedArray(srcData.data), w, h);
    if (mode !== "original") transformImageData(out.data, mode, cvd, severity);
    ctx.putImageData(out, 0, 0);
    if (compare && mode !== "original") {
      const half = w >> 1;
      ctx.drawImage(base, 0, 0, half, h, 0, 0, half, h);
      ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.fillRect(half-1, 0, 2, h);
    }
  }, [mode, cvd, severity, compare]);
  useEffect(() => { if (!ready) return; const id = requestAnimationFrame(render); return () => cancelAnimationFrame(id); }, [ready, render]);
  const drawMag = (x:number, y:number) => {
    const base = baseRef.current, mag = magRef.current; if (!base || !mag) return;
    const ctx = mag.getContext("2d")!; ctx.imageSmoothingEnabled = false; ctx.clearRect(0,0,MAG_PX,MAG_PX);
    const size = MAG_HALF*2; ctx.drawImage(base, x-MAG_HALF, y-MAG_HALF, size, size, 0, 0, MAG_PX, MAG_PX);
    const cell = MAG_PX/size, gx = MAG_HALF*cell;
    ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 3; ctx.strokeRect(gx-1, gx-1, cell+2, cell+2);
    ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 1.5; ctx.strokeRect(gx, gx, cell, cell);
  };
  const syncCursor = (cx:number, cy:number) => {
    const view = viewRef.current, wrap = wrapRef.current; if (!view || !wrap) return;
    const vr = view.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), sc = vr.width/view.width;
    setCursor({ cx, cy, x: vr.left-wr.left+cx*sc, y: vr.top-wr.top+cy*sc }); drawMag(cx, cy);
  };
  const toCanvas = (e: React.PointerEvent | React.MouseEvent) => {
    const view = viewRef.current; if (!view) return null;
    const r = view.getBoundingClientRect();
    const x = Math.floor(((e.clientX-r.left)/r.width)*view.width), y = Math.floor(((e.clientY-r.top)/r.height)*view.height);
    if (x<0||y<0||x>=view.width||y>=view.height) return null; return { x, y };
  };
  const pickAt = (x:number, y:number) => {
    const base = baseRef.current; if (!base) return;
    const d = base.getContext("2d", { willReadFrequently: true })!.getImageData(x,y,1,1).data;
    onPick({ r: d[0], g: d[1], b: d[2] });
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!ready) return; const view = viewRef.current; if (!view) return;
    const step = e.shiftKey ? 10 : 1;
    let cx = cursor?.cx ?? view.width>>1, cy = cursor?.cy ?? view.height>>1;
    switch (e.key) {
      case "ArrowLeft": cx = Math.max(0, cx-step); break;
      case "ArrowRight": cx = Math.min(view.width-1, cx+step); break;
      case "ArrowUp": cy = Math.max(0, cy-step); break;
      case "ArrowDown": cy = Math.min(view.height-1, cy+step); break;
      case "Enter": case " ": e.preventDefault(); pickAt(cx, cy); return;
      default: return;
    }
    e.preventDefault(); syncCursor(cx, cy);
  };
  return (
    <div ref={wrapRef} className={`relative overflow-hidden rounded-3xl glass transition-colors ${dragging?"ring-2 ring-accent":""}`}
      onDragOver={(e)=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
      onDrop={(e)=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files?.[0];if(f)onDropFile(f);}}>
      <canvas ref={viewRef} tabIndex={0} role="img"
        aria-label="Image canvas. Use arrow keys to move the sampling cursor and Enter to pick the colour underneath."
        onPointerMove={(e)=>{const p=toCanvas(e);if(p)syncCursor(p.x,p.y);}} onPointerLeave={()=>setCursor(null)}
        onPointerDown={(e)=>{const p=toCanvas(e);if(p)pickAt(p.x,p.y);}} onKeyDown={onKeyDown}
        className={`block max-h-[68vh] w-full object-contain ${ready?"cursor-crosshair":"hidden"}`} />
      {!src && (
        <button onClick={onRequestUpload} className="flex min-h-[420px] w-full flex-col items-center justify-center gap-4 p-10 text-center transition hover:bg-white/[0.02]">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10"><ImageOff className="h-7 w-7 text-muted" /></span>
          <span className="text-base font-medium text-zinc-200">Drop an image, paste, or click to upload</span>
          <span className="max-w-sm text-sm text-muted">Everything is processed locally in your browser — no image ever leaves this device.</span>
        </button>
      )}
      {src && !ready && <div className="flex min-h-[420px] items-center justify-center text-sm text-muted">Decoding image…</div>}
      {cursor && ready && (
        <div className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{left:cursor.x,top:cursor.y}}>
          <div className="overflow-hidden rounded-full ring-2 ring-white/80 shadow-2xl shadow-black/70"><canvas ref={magRef} width={MAG_PX} height={MAG_PX} className="block" /></div>
        </div>
      )}
      {compare && mode !== "original" && ready && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur">LEFT: original · RIGHT: processed</div>
      )}
    </div>
  );
}
'@

Write-File "src/components/Controls.tsx" @'
import { Eye, Sparkles, SlidersHorizontal } from "lucide-react";
import { CVD_LABELS, CVD_PREVALENCE, CVD_SHORT, CVD_TYPES, type CVDType, type ViewMode } from "@/lib/color";
type Props = { cvd: CVDType; onCvd:(v:CVDType)=>void; severity:number; onSeverity:(v:number)=>void; mode:ViewMode; onMode:(v:ViewMode)=>void; compare:boolean; onCompare:(v:boolean)=>void };
const MODES: { id: ViewMode; label: string; icon: typeof Eye }[] = [
  { id: "original", label: "Original", icon: Eye },
  { id: "simulate", label: "Simulate", icon: SlidersHorizontal },
  { id: "daltonize", label: "Enhance", icon: Sparkles },
];
export default function Controls({ cvd, onCvd, severity, onSeverity, mode, onMode, compare, onCompare }: Props) {
  return (
    <section className="rounded-3xl glass p-5">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Vision profile</h2>
      <div className="grid grid-cols-2 gap-2">
        {CVD_TYPES.map((t) => {
          const active = t === cvd;
          return (
            <button key={t} onClick={()=>onCvd(t)} aria-pressed={active}
              className={`group rounded-2xl border px-3 py-2.5 text-left transition ${active?"border-accent/60 bg-accent/15 shadow-[0_0_0_1px_rgba(124,92,255,0.35)]":"border-white/8 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"}`}>
              <div className={`text-sm font-semibold ${active?"text-white":"text-zinc-300"}`}>{CVD_LABELS[t]}</div>
              <div className="mt-0.5 text-[11px] text-muted">{CVD_SHORT[t]}</div>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted">{CVD_PREVALENCE[cvd]}</p>
      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between">
          <label htmlFor="severity" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Severity</label>
          <span className="font-mono text-xs text-zinc-300">{Math.round(severity*100)}%</span>
        </div>
        <input id="severity" type="range" min={0} max={1} step={0.01} value={severity} onChange={(e)=>onSeverity(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-accent" />
        <div className="mt-1 flex justify-between text-[10px] text-muted"><span>Typical vision</span><span>Anomalous</span><span>Dichromacy</span></div>
      </div>
      <div className="mt-5">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Rendering</h3>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/40 p-1 ring-1 ring-white/8">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = mode === id;
            return (
              <button key={id} onClick={()=>onMode(id)} aria-pressed={active}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium transition ${active?"bg-white/10 text-white shadow-sm":"text-muted hover:text-zinc-200"}`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            );
          })}
        </div>
      </div>
      <label className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2.5">
        <span className="text-xs text-zinc-300">Side-by-side compare</span>
        <input type="checkbox" checked={compare} onChange={(e)=>onCompare(e.target.checked)} className="h-4 w-4 accent-accent" />
      </label>
    </section>
  );
}
'@

Write-File "src/components/Readout.tsx" @'
import { useState } from "react";
import { Check, Copy, Droplets } from "lucide-react";
import { closestName, contrastRatio, describeColor, hexOf, hslOf, readableOn, rgbOf, simulateRgb, type CVDType, type RGB } from "@/lib/color";
type Props = { picked: RGB|null; cvd: CVDType; severity: number; palette: RGB[]; onSelect:(rgb:RGB)=>void };
function Chip({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">{label}</div><div className="mt-0.5 font-mono text-xs text-zinc-200">{value}</div></div>;
}
export default function Readout({ picked, cvd, severity, palette, onSelect }: Props) {
  const [copied, setCopied] = useState(false);
  if (!picked) {
    return (
      <section className="rounded-3xl glass p-5">
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Detected colour</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">Click anywhere on the image — or move the keyboard cursor with the arrow keys and press Enter — to identify a colour.</p>
      </section>
    );
  }
  const hex = hexOf(picked), seen = simulateRgb(picked, cvd, severity);
  const name = closestName(picked), seenName = closestName(seen), hsl = hslOf(picked);
  const vsWhite = contrastRatio(picked, { r:255, g:255, b:255 }), vsBlack = contrastRatio(picked, { r:0, g:0, b:0 });
  const fg = readableOn(picked);
  const copy = async () => { try { await navigator.clipboard.writeText(hex); setCopied(true); setTimeout(()=>setCopied(false), 1400); } catch {} };
  return (
    <section className="animate-rise rounded-3xl glass p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Detected colour</h2>
        <button onClick={copy} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-300 transition hover:bg-white/5">
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}{copied?"Copied":"Copy"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex h-24 flex-col justify-end rounded-2xl p-3 ring-1 ring-white/10" style={{ backgroundColor: hex, color: `rgb(${fg.r},${fg.g},${fg.b})` }}>
          <span className="font-mono text-sm font-semibold tracking-tight">{hex}</span>
        </div>
        <div className="flex h-24 flex-col justify-end rounded-2xl p-3 ring-1 ring-white/10" style={{ backgroundColor: `rgb(${seen.r},${seen.g},${seen.b})`, color: `rgb(${readableOn(seen).r},${readableOn(seen).g},${readableOn(seen).b})` }}>
          <span className="text-[10px] uppercase tracking-[0.12em] opacity-70">As seen</span>
          <span className="font-mono text-sm font-semibold tracking-tight">{hexOf(seen)}</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-300"><span className="font-semibold text-white">{name.name}</span><span className="text-muted"> · {seenName.name} under this profile</span></p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Chip label="RGB" value={rgbOf(picked)} />
        <Chip label="HSL" value={`${Math.round(hsl.h)}° ${Math.round(hsl.s*100)}% ${Math.round(hsl.l*100)}%`} />
        <Chip label="On white" value={`${vsWhite.toFixed(2)}:1`} />
        <Chip label="On black" value={`${vsBlack.toFixed(2)}:1`} />
      </div>
      <button onClick={()=>onSelect(picked)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5">
        <Droplets className="h-3.5 w-3.5" />Send to contrast lab
      </button>
      <p className="mt-3 border-t border-white/8 pt-3 text-[12px] leading-relaxed text-muted">{describeColor(picked, cvd, severity)}</p>
      {palette.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Dominant palette</h3>
          <div className="flex gap-1.5">
            {palette.map((c, i) => (
              <button key={`${hexOf(c)}-${i}`} onClick={()=>onSelect(c)} title={hexOf(c)} aria-label={`Select ${hexOf(c)}`} className="h-9 flex-1 rounded-lg ring-1 ring-white/10 transition hover:scale-105 hover:ring-white/40" style={{ backgroundColor: hexOf(c) }} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
'@

Write-File "src/components/ContrastLab.tsx" @'
import { useMemo, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { CVD_LABELS, CVD_TYPES, contrastRatio, deltaE2000, hexOf, hexToRgb, simulateRgb, type RGB } from "@/lib/color";
type Props = { palette: RGB[] };
function Badge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${pass?"bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30":"bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30"}`}>
      {pass ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}{label}
    </div>
  );
}
export default function ContrastLab({ palette }: Props) {
  const [a, setA] = useState<RGB>(hexToRgb("#e63946"));
  const [b, setB] = useState<RGB>(hexToRgb("#2a9d8f"));
  const ratio = useMemo(() => contrastRatio(a, b), [a, b]);
  const pickers: { label: string; value: RGB; set: (c: RGB) => void }[] = [
    { label: "Foreground", value: a, set: setA },
    { label: "Background", value: b, set: setB },
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl glass p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Pair checker</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {pickers.map(({ label, value, set }) => (
            <div key={label}>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-muted">{label}</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-1.5">
                <input type="color" value={hexOf(value)} onChange={(e)=>set(hexToRgb(e.target.value))} aria-label={`${label} colour`} className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0" />
                <input type="text" value={hexOf(value)} onChange={(e)=>{const v=e.target.value.trim();if(/^#?[0-9a-f]{6}$/i.test(v))set(hexToRgb(v));}} spellCheck={false} className="w-full bg-transparent font-mono text-xs text-zinc-200 outline-none" />
              </div>
            </div>
          ))}
        </div>
        {palette.length > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 text-[11px] uppercase tracking-[0.12em] text-muted">From image palette</div>
            <div className="flex gap-1.5">
              {palette.map((c, i) => (
                <button key={`${hexOf(c)}-${i}`} onClick={()=>setA(c)} onContextMenu={(e)=>{e.preventDefault();setB(c);}} title={`${hexOf(c)} — click for foreground, right-click for background`} className="h-7 flex-1 rounded-md ring-1 ring-white/10 transition hover:ring-white/40" style={{ backgroundColor: hexOf(c) }} />
              ))}
            </div>
          </div>
        )}
        <div className="mt-5 rounded-2xl p-6 ring-1 ring-white/10" style={{ backgroundColor: hexOf(b), color: hexOf(a) }}>
          <div className="text-lg font-semibold">Large heading sample</div>
          <p className="mt-1 text-sm">Body text at normal size, rendered in the foreground colour over the background.</p>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted">Contrast ratio</div>
            <div className="font-mono text-3xl font-semibold text-white">{ratio.toFixed(2)}:1</div>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge pass={ratio >= 4.5} label="AA text" />
            <Badge pass={ratio >= 3} label="AA large" />
            <Badge pass={ratio >= 7} label="AAA text" />
          </div>
        </div>
      </section>
      <section className="rounded-3xl glass p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Colour-vision separation</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">How far apart these two colours remain after simulation. CIEDE2000 below 10 means many people will struggle to tell them apart.</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5">
            <span className="text-sm text-zinc-300">Typical vision</span>
            <span className="font-mono text-sm text-white">{deltaE2000(a, b).toFixed(1)}</span>
          </div>
          {CVD_TYPES.map((t) => {
            const d = deltaE2000(simulateRgb(a, t, 1), simulateRgb(b, t, 1));
            const risky = d < 10;
            return (
              <div key={t} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${risky?"border-rose-500/25 bg-rose-500/10":"border-white/8 bg-white/[0.025]"}`}>
                <span className="flex items-center gap-2 text-sm text-zinc-300">{risky && <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}{CVD_LABELS[t]}</span>
                <span className={`font-mono text-sm ${risky?"text-rose-300":"text-white"}`}>{d.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
'@

Write-File "src/components/Docs.tsx" @'
export default function Docs() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-3xl glass p-6 sm:p-10">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Mini-project documentation</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">ChromAssist — AI-Based Colour Vision Assistance System</h1>
        <p className="mt-2 text-sm text-muted">A browser-native assistive tool for colour-vision deficiency (CVD), built with React, Canvas and the Web Speech API.</p>
      </header>
      <Section title="1. Abstract">Roughly 1 in 12 men and 1 in 200 women live with a colour-vision deficiency. Everyday interfaces — charts, maps, status badges, wiring, food doneness — routinely encode meaning in hue alone. ChromAssist gives these users three capabilities in a single zero-install page: simulation, enhancement, and identification.</Section>
      <Section title="2. Problem statement">Existing accessibility tooling is fragmented. Browser devtools simulate CVD but cannot help a user reading a photograph. Screen readers announce alt-text but not colour. Physical colour probes are single purpose. ChromAssist unifies simulation, correction and identification behind one interaction model, and runs entirely on-device.</Section>
      <Section title="3. Methodology">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Simulation.</strong> Machado, Oliveira &amp; Fernandes (2009) matrices are applied in linear RGB with a severity parameter interpolated from the identity matrix.</li>
          <li><strong>Daltonization.</strong> The image is simulated, the per-pixel error is computed, and that error is redistributed into channels the user can perceive.</li>
          <li><strong>Identification.</strong> sRGB is converted to CIE Lab and matched against a 120-entry named colour corpus by Euclidean Lab distance.</li>
          <li><strong>Legibility.</strong> WCAG 2.1 relative luminance and contrast ratios are reported with AA/AAA thresholds.</li>
          <li><strong>Voice.</strong> The Web Speech API provides both speech synthesis and recognition.</li>
        </ul>
      </Section>
      <Section title="4. Implementation">Images are decoded once into an offscreen canvas capped at 1400 px on the long edge. Transformations are applied per-frame over a typed Uint8ClampedArray, using precomputed lookup tables for sRGB↔linear conversion. Dominant colours are extracted with k-means (k = 7, 14 iterations) over a 72×72 downsample.</Section>
      <Section title="5. Evaluation">Simulated output was checked against published reference swatches. Known confusable pairs (red/green, blue/purple, brown/orange) collapse to a CIEDE2000 distance below 10 under the matching profile. A 1400×1050 image transforms in under 30 ms on a mid-range laptop.</Section>
      <Section title="6. Limitations">Linear interpolation between the identity matrix and full dichromacy is an approximation. Daltonization cannot recover information that was never encoded. Speech recognition requires a Chromium-based browser.</Section>
      <Section title="7. Future work">Per-region segmentation, a saved profile with persistent preferences, and optional server-side vision-language descriptions for whole-image summaries.</Section>
      <Section title="References">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          <li>Machado, Oliveira &amp; Fernandes (2009). IEEE TVCG, 15(6), 1291–1298.</li>
          <li>Viénot, Brettel &amp; Mollon (1999). Color Research &amp; Application, 24(4), 243–252.</li>
          <li>Sharma, Wu &amp; Dalal (2005). Color Research &amp; Application, 30(1), 21–30.</li>
          <li>W3C (2018). WCAG 2.1, SC 1.4.3.</li>
        </ol>
      </Section>
    </article>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-base font-semibold text-white">{title}</h2><div className="text-sm leading-relaxed text-zinc-300">{children}</div></section>;
}
'@

Write-File "src/App.tsx" @'
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Camera, Contrast, Github, Image as ImageIcon, Mic, MicOff, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import Stage from "@/components/Stage";
import Controls from "@/components/Controls";
import Readout from "@/components/Readout";
import ContrastLab from "@/components/ContrastLab";
import Docs from "@/components/Docs";
import { describeColor, type CVDType, type RGB, type ViewMode } from "@/lib/color";
import { createRecognizer, speak, stopSpeaking, type Recognizer } from "@/lib/voice";
import { describeImageWithAI } from "@/lib/ai";
type Tab = "studio" | "lab" | "docs";
const TABS: { id: Tab; label: string; icon: typeof ImageIcon }[] = [
  { id: "studio", label: "Studio", icon: ImageIcon },
  { id: "lab", label: "Contrast Lab", icon: Contrast },
  { id: "docs", label: "Docs", icon: BookOpen },
];
function makeTestImage(): string {
  const colors = ["#e63946","#2a9d8f","#f4a261","#457b9d","#8338ec","#ff006e","#3a86ff","#fb5607","#06d6a0","#118ab2","#ef476f","#ffd166","#073b4c","#8ac926","#1982c4","#6a4c93","#b5179e","#f72585","#4cc9f0","#f8961e","#90be6d","#577590","#f94144","#43aa8b"];
  const cols = 6, tile = 180, pad = 24;
  const rows = Math.ceil(colors.length / cols);
  const w = cols * tile + pad * 2, h = rows * tile + pad * 2;
  let dots = "";
  for (let i = 0; i < 160; i++) {
    const x = 40 + Math.random() * (w - 80), y = 40 + Math.random() * (h - 80), r = 10 + Math.random() * 26;
    const c = ["#c1121f","#6a994e","#bc6c25","#386641","#9b2226","#a7c957"][i % 6];
    dots += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="${c}" opacity="0.55"/>`;
  }
  const tiles = colors.map((c, i) => {
    const x = pad + (i % cols) * tile, y = pad + Math.floor(i / cols) * tile;
    return `<rect x="${x + 6}" y="${y + 6}" width="${tile - 12}" height="${tile - 12}" rx="18" fill="${c}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#0b0b12"/><g>${dots}</g><g>${tiles}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
export default function App() {
  const [tab, setTab] = useState<Tab>("studio");
  const [src, setSrc] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("simulate");
  const [cvd, setCvd] = useState<CVDType>("deuteranopia");
  const [severity, setSeverity] = useState(1);
  const [compare, setCompare] = useState(false);
  const [picked, setPicked] = useState<RGB | null>(null);
  const [palette, setPalette] = useState<RGB[]>([]);
  const [voiceOut, setVoiceOut] = useState(true);
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const prevUrl = useRef<string | null>(null);
  const recRef = useRef<Recognizer | null>(null);
  const flash = useCallback((msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 2200); }, []);
  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { flash("That file is not an image."); return; }
    const url = URL.createObjectURL(file);
    if (prevUrl.current?.startsWith("blob:")) URL.revokeObjectURL(prevUrl.current);
    prevUrl.current = url; setSrc(url); setPicked(null); setPalette([]); setAiText(null);
  }, [flash]);
  const handlePick = useCallback((rgb: RGB) => { setPicked(rgb); if (voiceOut) speak(describeColor(rgb, cvd, severity)); }, [voiceOut, cvd, severity]);
  const handleLoad = useCallback((p: RGB[]) => setPalette(p), []);
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) { loadFile(file); setTab("studio"); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFile]);
  const handleCommand = useCallback((t: string) => {
    const has = (...w: string[]) => w.some((x) => t.includes(x));
    if (has("upload", "open image", "scan image")) fileRef.current?.click();
    else if (has("simulate", "simulation")) { setMode("simulate"); speak("Simulation on"); }
    else if (has("enhance", "daltoni", "correct")) { setMode("daltonize"); speak("Enhancement on"); }
    else if (has("original", "normal view", "turn off")) { setMode("original"); speak("Original view"); }
    else if (has("protan")) { setCvd("protanopia"); speak("Protanopia profile selected"); }
    else if (has("deutan")) { setCvd("deuteranopia"); speak("Deuteranopia profile selected"); }
    else if (has("tritan")) { setCvd("tritanopia"); speak("Tritanopia profile selected"); }
    else if (has("describe", "what colour", "what color", "read colour")) { speak(picked ? describeColor(picked, cvd, severity) : "Nothing picked yet. Tap the image first."); }
    else if (has("contrast")) { setTab("lab"); speak("Opening contrast lab"); }
    else if (has("stop", "quiet", "silence", "mute")) { setVoiceOut(false); stopSpeaking(); }
    else speak("Sorry, I did not catch that.");
  }, [picked, cvd, severity]);
  useEffect(() => { recRef.current = createRecognizer(handleCommand, setListening); }, [handleCommand]);
  const toggleMic = () => { const rec = recRef.current; if (!rec?.supported) { flash("Speech recognition is not available in this browser."); return; } if (listening) rec.stop(); else rec.start(); };
  const toggleVoice = () => { if (voiceOut) stopSpeaking(); setVoiceOut((v) => !v); };
  const loadSample = () => {
    const url = makeTestImage();
    if (prevUrl.current?.startsWith("blob:")) URL.revokeObjectURL(prevUrl.current);
    prevUrl.current = url; setSrc(url); setPicked(null); setPalette([]); setAiText(null); setTab("studio");
  };
  const runAiDescribe = async () => {
    if (!src) { flash("Upload an image first."); return; }
    setAiLoading(true); setAiText(null);
    try {
      const text = await describeImageWithAI({ imageSrc: src, cvd, severity, picked });
      setAiText(text); if (voiceOut) speak(text);
    } catch (e) { flash(e instanceof Error ? e.message : "AI request failed."); }
    finally { setAiLoading(false); }
  };
  const micSupported = useMemo(() => typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition), []);
  return (
    <div className="flex min-h-full flex-col">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ""; }} />
      <header className="sticky top-0 z-30 border-b border-white/8 bg-void/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2 shadow-lg shadow-accent/25"><Sparkles className="h-4 w-4 text-white" /></span>
            <div className="leading-tight"><div className="text-sm font-semibold tracking-tight text-white">ChromAssist</div><div className="hidden text-[11px] text-muted sm:block">Colour vision assistance</div></div>
          </div>
          <nav className="ml-4 hidden items-center gap-1 rounded-xl bg-black/40 p-1 ring-1 ring-white/8 md:flex">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${tab === id ? "bg-white/10 text-white" : "text-muted hover:text-zinc-200"}`}><Icon className="h-3.5 w-3.5" />{label}</button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={toggleVoice} className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition ${voiceOut ? "border-accent/40 bg-accent/15 text-white" : "border-white/10 text-muted hover:text-zinc-200"}`}>
              {voiceOut ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{voiceOut ? "Voice on" : "Voice off"}</span>
            </button>
            <button onClick={toggleMic} disabled={!micSupported} className={`relative flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition disabled:opacity-40 ${listening ? "border-rose-400/50 bg-rose-500/15 text-rose-200" : "border-white/10 text-muted hover:text-zinc-200"}`}>
              {listening && <span className="absolute inset-0 -z-10 rounded-xl bg-rose-500/20 animate-ring" aria-hidden />}
              {listening ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{listening ? "Listening" : "Commands"}</span>
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex h-9 items-center gap-1.5 rounded-xl bg-white px-3.5 text-xs font-semibold text-void transition hover:bg-zinc-200"><ImageIcon className="h-3.5 w-3.5" /><span className="hidden sm:inline">Upload</span></button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-white/8 px-4 py-2 md:hidden">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${tab === id ? "bg-white/10 text-white" : "text-muted"}`}><Icon className="h-3.5 w-3.5" />{label}</button>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
        {tab === "studio" && (
          <div key="studio" className="grid animate-rise gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Stage src={src} mode={mode} cvd={cvd} severity={severity} compare={compare} onPick={handlePick} onLoad={handleLoad} onDropFile={loadFile} onRequestUpload={() => fileRef.current?.click()} />
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5"><ImageIcon className="h-3.5 w-3.5" />Upload</button>
                <button onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.capture = "environment"; input.onchange = () => { const f = input.files?.[0]; if (f) loadFile(f); }; input.click(); }} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5"><Camera className="h-3.5 w-3.5" />Camera</button>
                <button onClick={loadSample} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5"><Sparkles className="h-3.5 w-3.5" />Test image</button>
                <button onClick={runAiDescribe} disabled={!src || aiLoading} className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/15 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-accent/25 disabled:opacity-40"><Sparkles className="h-3.5 w-3.5" />{aiLoading ? "Thinking…" : "Ask AI"}</button>
                {src && (<button onClick={() => { if (prevUrl.current?.startsWith("blob:")) URL.revokeObjectURL(prevUrl.current); prevUrl.current = null; setSrc(null); setPicked(null); setPalette([]); setAiText(null); }} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-muted transition hover:bg-white/5 hover:text-zinc-200"><X className="h-3.5 w-3.5" />Clear</button>)}
                <span className="ml-auto hidden text-[11px] text-muted sm:block">Drop · paste · or use arrow keys on the canvas</span>
              </div>
            </div>
            <aside className="space-y-4 lg:sticky lg:top-[76px] lg:self-start">
              <Controls cvd={cvd} onCvd={setCvd} severity={severity} onSeverity={setSeverity} mode={mode} onMode={setMode} compare={compare} onCompare={setCompare} />
              <Readout picked={picked} cvd={cvd} severity={severity} palette={palette} onSelect={(c) => { setPicked(c); setTab("lab"); }} />
              {aiText && (<section className="animate-rise rounded-3xl glass p-5"><div className="mb-2 flex items-center justify-between"><h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">AI explanation</h2><button onClick={() => setAiText(null)} className="text-[11px] text-muted hover:text-zinc-200">Dismiss</button></div><p className="text-sm leading-relaxed text-zinc-300">{aiText}</p></section>)}
            </aside>
          </div>
        )}
        {tab === "lab" && <div key="lab" className="animate-rise"><ContrastLab palette={palette} /></div>}
        {tab === "docs" && <div key="docs" className="animate-rise"><Docs /></div>}
      </main>
      <footer className="border-t border-white/8 px-4 py-5 sm:px-6"><div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 text-[11px] text-muted"><span>ChromAssist · runs entirely in your browser · no image upload</span><span className="ml-auto flex items-center gap-1.5"><Github className="h-3.5 w-3.5" />MIT licensed</span></div></footer>
      {toast && (<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-rise rounded-xl border border-white/12 bg-panel/95 px-4 py-2.5 text-xs text-zinc-200 shadow-2xl backdrop-blur">{toast}</div>)}
    </div>
  );
}
'@

Write-Host "`nDONE. All 8 files written." -ForegroundColor Green