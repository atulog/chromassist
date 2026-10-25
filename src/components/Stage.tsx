import { useCallback, useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { transformImageData, type CVDType, type RGB, type ViewMode } from "@/lib/color";
import { extractPalette } from "@/lib/palette";

const MAX_EDGE = 1400;

type Props = { 
  src: string | null; 
  mode: ViewMode; 
  cvd: CVDType; 
  severity: number; 
  compare: boolean; 
  onPick: (rgb: RGB) => void; 
  onLoad: (p: RGB[]) => void; 
  onDropFile: (f: File) => void; 
  onRequestUpload: () => void 
};

export default function Stage({ src, mode, cvd, severity, compare, onPick, onLoad, onDropFile, onRequestUpload }: Props) {
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  
  const onLoadRef = useRef(onLoad); 
  onLoadRef.current = onLoad;
  
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [crosshair, setCrosshair] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!src) { baseRef.current = null; setReady(false); return; }
    let alive = true;
    const img = new Image(); 
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!alive) return;
      const s = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * s)), h = Math.max(1, Math.round(img.naturalHeight * s));
      
      const base = document.createElement("canvas"); 
      base.width = w; 
      base.height = h;
      base.getContext("2d", { willReadFrequently: true })!.drawImage(img, 0, 0, w, h);
      baseRef.current = base;
      
      const v = viewRef.current; 
      if (v) { v.width = w; v.height = h; }
      
      setReady(true); 
      onLoadRef.current(extractPalette(base, 7));
    };
    img.onerror = () => alive && setReady(false);
    img.src = src; 
    return () => { alive = false; };
  }, [src]);

  const render = useCallback(() => {
    const base = baseRef.current, view = viewRef.current; 
    if (!base || !view) return;
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
      ctx.fillStyle = "rgba(255,255,255,.9)"; 
      ctx.fillRect(half - 1, 0, 2, h);
    }
  }, [mode, cvd, severity, compare]);

  useEffect(() => { 
    if (!ready) return; 
    const id = requestAnimationFrame(render); 
    return () => cancelAnimationFrame(id); 
  }, [ready, render]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const view = viewRef.current; 
    if (!view) return;
    const rect = view.getBoundingClientRect();
    
    // Calculate position relative to the container for the visual crosshair
    const wrapRect = wrapRef.current?.getBoundingClientRect();
    if (wrapRect) {
      setCrosshair({
        x: e.clientX - wrapRect.left,
        y: e.clientY - wrapRect.top
      });
    }
  };

  const handlePointerLeave = () => setCrosshair(null);

  const pickAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const view = viewRef.current; 
    const base = baseRef.current;
    if (!view || !base) return;
    
    const rect = view.getBoundingClientRect();
    
    // Perfectly map display coordinates to source image coordinates
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * base.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * base.height);
    
    if (x < 0 || y < 0 || x >= base.width || y >= base.height) return;

    // Read exactly one source-image pixel
    const ctx = base.getContext("2d", { willReadFrequently: true })!;
    const d = ctx.getImageData(x, y, 1, 1).data;
    onPick({ r: d[0], g: d[1], b: d[2] });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!ready) return; 
    const view = viewRef.current; 
    if (!view) return;
    const step = e.shiftKey ? 10 : 1;
    let cx = view.width >> 1, cy = view.height >> 1;
    
    // (Optional) You can expand keyboard navigation to track the crosshair here
    switch (e.key) {
      case "Enter": 
      case " ": 
        e.preventDefault(); 
        // Dummy event for keyboard picking
        const rect = view.getBoundingClientRect();
        pickAt({ clientX: rect.left + cx, clientY: rect.top + cy } as any); 
        return;
      default: return;
    }
  };

  return (
    <div 
      ref={wrapRef} 
      className={`relative overflow-hidden rounded-3xl glass transition-colors ${dragging ? "ring-2 ring-accent" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }} 
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onDropFile(f); }}
    >
      <canvas 
        ref={viewRef} 
        tabIndex={0} 
        role="img"
        aria-label="Image canvas. Click to pick colour."
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={pickAt} 
        onKeyDown={onKeyDown}
        className={`block max-h-[68vh] w-full object-contain ${ready ? "cursor-crosshair" : "hidden"}`} 
      />

      {/* --- The requested custom crosshair overlay --- */}
      {crosshair && ready && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: crosshair.x,
            top: crosshair.y,
            width: 15,
            height: 15,
            border: "1px solid white",
            outline: "1px solid black",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 50
          }}
        />
      )}

      {!src && (
        <button onClick={onRequestUpload} className="flex min-h-[420px] w-full flex-col items-center justify-center gap-4 p-10 text-center transition hover:bg-white/[0.02]">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10"><ImageOff className="h-7 w-7 text-muted" /></span>
          <span className="text-xl font-bold text-slate-900">Start exploring your image</span>
          <span className="max-w-md text-sm text-slate-500 leading-relaxed">
            Upload an image to simulate color vision differences, inspect individual pixel colors, or enhance color distinctions for accessibility.
          </span>
          <span className="mt-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-600/20">
            Click to upload or drag & drop
          </span>
        </button>
      )}
      
      {src && !ready && <div className="flex min-h-[420px] items-center justify-center text-sm text-muted">Decoding image...</div>}
      
      {compare && mode !== "original" && ready && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur">LEFT: original | RIGHT: processed</div>
      )}
    </div>
  );
}
