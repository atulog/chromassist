import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Camera, Contrast, Github, Image as ImageIcon, Mic, MicOff, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import Stage from "@/components/Stage";
import Controls from "@/components/Controls";
import Readout from "@/components/Readout";
import ContrastLab from "@/components/ContrastLab";
import Docs from "@/components/Docs";
import LandingPage from "@/components/LandingPage";
import { closestName, describeColor, type CVDType, type RGB, type ViewMode } from "@/lib/color";
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
  const [showLanding, setShowLanding] = useState(true);
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
  const handlePick = useCallback((rgb: RGB) => { setPicked(rgb); if (voiceOut) speak(closestName(rgb).name); }, [voiceOut, cvd, severity]);
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
    if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }
  return (
    <div className="flex min-h-full flex-col">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ""; }} />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-void/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2 shadow-lg shadow-accent/25"><Sparkles className="h-4 w-4 text-white" /></span>
            <div className="leading-tight"><div className="text-sm font-semibold tracking-tight text-white">ChromAssist</div><div className="hidden text-[11px] text-muted sm:block">Colour vision assistance</div></div>
          </div>
          <nav className="ml-4 hidden items-center gap-1 rounded-xl bg-white/10 p-1 ring-1 ring-white/8 md:flex">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${tab === id ? "bg-white/20 text-white" : "text-muted hover:text-zinc-200"}`}><Icon className="h-3.5 w-3.5" />{label}</button>
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
        <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${tab === id ? "bg-white/20 text-white" : "text-muted"}`}><Icon className="h-3.5 w-3.5" />{label}</button>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
        {tab === "studio" && (
          <div key="studio" className="grid animate-rise gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Stage src={src} mode={mode} cvd={cvd} severity={severity} compare={compare} onPick={handlePick} onLoad={handleLoad} onDropFile={loadFile} onRequestUpload={() => fileRef.current?.click()} />
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10"><ImageIcon className="h-3.5 w-3.5" />Upload</button>
                <button onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.capture = "environment"; input.onchange = () => { const f = input.files?.[0]; if (f) loadFile(f); }; input.click(); }} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10"><Camera className="h-3.5 w-3.5" />Camera</button>
                <button onClick={loadSample} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10"><Sparkles className="h-3.5 w-3.5" />Test image</button>
                <button onClick={runAiDescribe} disabled={!src || aiLoading} className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/15 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-accent/25 disabled:opacity-40"><Sparkles className="h-3.5 w-3.5" />{aiLoading ? "ThinkingÃ¢â‚¬Â¦" : "Ask AI"}</button>
                {src && (<button onClick={() => { if (prevUrl.current?.startsWith("blob:")) URL.revokeObjectURL(prevUrl.current); prevUrl.current = null; setSrc(null); setPicked(null); setPalette([]); setAiText(null); }} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-muted transition hover:bg-white/10 hover:text-zinc-200"><X className="h-3.5 w-3.5" />Clear</button>)}
                <span className="ml-auto hidden text-[11px] text-muted sm:block">Drop | paste | or use arrow keys on the canvas</span>
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
      <footer className="border-t border-white/10 px-4 py-5 sm:px-6"><div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 text-[11px] text-muted"><span>ChromAssist | runs entirely in your browser | no image upload</span><span className="ml-auto flex items-center gap-1.5"><Github className="h-3.5 w-3.5" />MIT licensed</span></div></footer>
      {toast && (<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-rise rounded-xl border border-white/20 bg-white/95 px-4 py-2.5 text-xs text-zinc-200 shadow-2xl backdrop-blur">{toast}</div>)}
    </div>
  );
}
