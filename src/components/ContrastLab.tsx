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
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Pair checker</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {pickers.map(({ label, value, set }) => (
            <div key={label}>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                <input type="color" value={hexOf(value)} onChange={(e)=>set(hexToRgb(e.target.value))} aria-label={`${label} colour`} className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0" />
                <input type="text" value={hexOf(value)} onChange={(e)=>{const v=e.target.value.trim();if(/^#?[0-9a-f]{6}$/i.test(v))set(hexToRgb(v));}} spellCheck={false} className="w-full bg-transparent font-mono text-xs text-slate-800 outline-none" />
              </div>
            </div>
          ))}
        </div>
        {palette.length > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 text-[11px] uppercase tracking-[0.12em] text-slate-500">From image palette</div>
            <div className="flex gap-1.5">
              {palette.map((c, i) => (
                <button key={`${hexOf(c)}-${i}`} onClick={()=>setA(c)} onContextMenu={(e)=>{e.preventDefault();setB(c);}} title={`${hexOf(c)} â€” click for foreground, right-click for background`} className="h-7 flex-1 rounded-md ring-1 ring-white/10 transition hover:ring-white/40" style={{ backgroundColor: hexOf(c) }} />
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
            <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Contrast ratio</div>
            <div className="font-mono text-3xl font-semibold text-slate-900">{ratio.toFixed(2)}:1</div>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge pass={ratio >= 4.5} label="AA text" />
            <Badge pass={ratio >= 3} label="AA large" />
            <Badge pass={ratio >= 7} label="AAA text" />
          </div>
        </div>
      </section>
      <section className="rounded-3xl glass p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Colour-vision separation</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">How far apart these two colours remain after simulation. CIEDE2000 below 10 means many people will struggle to tell them apart.</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <span className="text-sm text-slate-600">Typical vision</span>
            <span className="font-mono text-sm text-slate-900">{deltaE2000(a, b).toFixed(1)}</span>
          </div>
          {CVD_TYPES.map((t) => {
            const d = deltaE2000(simulateRgb(a, t, 1), simulateRgb(b, t, 1));
            const risky = d < 10;
            return (
              <div key={t} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${risky?"border-rose-500/25 bg-rose-500/10":"border-slate-200 bg-slate-50"}`}>
                <span className="flex items-center gap-2 text-sm text-slate-600">{risky && <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}{CVD_LABELS[t]}</span>
                <span className={`font-mono text-sm ${risky?"text-rose-300":"text-slate-900"}`}>{d.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}