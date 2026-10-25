import { useState } from "react";
import { Check, Copy, Droplets } from "lucide-react";
import { closestName, contrastRatio, describeColor, hexOf, hslOf, readableOn, rgbOf, simulateRgb, type CVDType, type RGB } from "@/lib/color";
type Props = { picked: RGB|null; cvd: CVDType; severity: number; palette: RGB[]; onSelect:(rgb:RGB)=>void };
function Chip({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</div><div className="mt-0.5 font-mono text-xs text-slate-800">{value}</div></div>;
}
export default function Readout({ picked, cvd, severity, palette, onSelect }: Props) {
  const [copied, setCopied] = useState(false);
  if (!picked) {
    return (
      <section className="rounded-3xl glass p-5">
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Detected colour</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">Click anywhere on the image - or move the keyboard cursor with the arrow keys and press Enter - to identify a colour.</p>
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
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Detected colour</h2>
        <button onClick={copy} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-700 transition hover:bg-white shadow-sm border border-slate-200">
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}{copied?"Copied":"Copy"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex h-24 flex-col justify-end rounded-2xl p-3 ring-1 ring-white/10" style={{ backgroundColor: hex, color: `rgb(${fg.r},${fg.g},${fg.b})` }}>
          <span className="text-[10px] uppercase tracking-[0.12em] opacity-70">True colour</span>
          <span className="font-mono text-sm font-semibold tracking-tight">{hex}</span>
        </div>
        <div className="flex h-24 flex-col justify-end rounded-2xl p-3 ring-1 ring-white/10" style={{ backgroundColor: `rgb(${seen.r},${seen.g},${seen.b})`, color: `rgb(${readableOn(seen).r},${readableOn(seen).g},${readableOn(seen).b})` }}>
          <span className="text-[10px] uppercase tracking-[0.12em] opacity-70">As seen</span>
          <span className="font-mono text-sm font-semibold tracking-tight">{hexOf(seen)}</span>
        </div>
      </div>
      <p aria-live="polite" aria-atomic="true" className="mt-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">{name.name}</span><span className="text-slate-500"> | reads as {seenName.name} for this profile</span></p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Chip label="RGB" value={rgbOf(picked)} />
        <Chip label="HSL" value={`${Math.round(hsl.h)}° ${Math.round(hsl.s*100)}% ${Math.round(hsl.l*100)}%`} />
        <Chip label="On white" value={`${vsWhite.toFixed(2)}:1`} />
        <Chip label="On black" value={`${vsBlack.toFixed(2)}:1`} />
      </div>
      <button onClick={()=>onSelect(picked)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-700 transition hover:bg-white shadow-sm border border-slate-200">
        <Droplets className="h-3.5 w-3.5" />Send to contrast lab
      </button>
      <p className="mt-3 border-t border-slate-200 pt-3 text-[12px] leading-relaxed text-slate-500">{describeColor(picked, cvd, severity)}</p>
      {palette.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Dominant palette</h3>
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
