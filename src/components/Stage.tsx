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
          <span className="max-w-sm text-sm text-muted">Everything is processed locally in your browser â€” no image ever leaves this device.</span>
        </button>
      )}
      {src && !ready && <div className="flex min-h-[420px] items-center justify-center text-sm text-muted">Decoding imageâ€¦</div>}
      {cursor && ready && (
        <div className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{left:cursor.x,top:cursor.y}}>
          <div className="overflow-hidden rounded-full ring-2 ring-white/80 shadow-2xl shadow-black/70"><canvas ref={magRef} width={MAG_PX} height={MAG_PX} className="block" /></div>
        </div>
      )}
      {compare && mode !== "original" && ready && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur">LEFT: original Â· RIGHT: processed</div>
      )}
    </div>
  );
}