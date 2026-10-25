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
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Vision profile</h2>
      <div className="grid grid-cols-2 gap-2">
        {CVD_TYPES.map((t) => {
          const active = t === cvd;
          return (
            <button key={t} onClick={()=>onCvd(t)} aria-pressed={active}
              className={`group rounded-2xl border px-3 py-2.5 text-left transition ${active?"border-blue-600 bg-blue-50 shadow-sm":"border-slate-200 bg-slate-50 hover:border-white/20 hover:bg-white/[0.05]"}`}>
              <div className={`text-sm font-semibold ${active?"text-slate-900":"text-slate-700"}`}>{CVD_LABELS[t]}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{CVD_SHORT[t]}</div>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">{CVD_PREVALENCE[cvd]}</p>
      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between">
          <label htmlFor="severity" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Severity</label>
          <span className="font-mono text-xs text-slate-700">{Math.round(severity*100)}%</span>
        </div>
        <input id="severity" type="range" min={0} max={1} step={0.01} value={severity} onChange={(e)=>onSeverity(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-blue-600" />
        <div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>Typical vision</span><span>Anomalous</span><span>Dichromacy</span></div>
      </div>
      <div className="mt-5">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Rendering</h3>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white shadow-sm border border-slate-200 p-1 ring-1 ring-white/8">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = mode === id;
            return (
              <button key={id} onClick={()=>onMode(id)} aria-pressed={active}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium transition ${active?"bg-white/20 text-slate-900 shadow-sm":"text-slate-500 hover:text-slate-800"}`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            );
          })}
        </div>
      </div>
      <label className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <span className="text-xs text-slate-700">Side-by-side compare</span>
        <input type="checkbox" checked={compare} onChange={(e)=>onCompare(e.target.checked)} className="h-4 w-4 accent-blue-600" />
      </label>
    </section>
  );
}