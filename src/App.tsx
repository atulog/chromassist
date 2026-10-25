import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Camera, Contrast, Github, Image as ImageIcon, Mic, MicOff, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import Stage from "@/components/Stage";
import Controls from "@/components/Controls";
import Readout from "@/components/Readout";
import ContrastLab from "@/components/ContrastLab";
import Docs from "@/components/Docs";
import LandingPage from "@/components/LandingPage";
import { closestName, type CVDType, type RGB, type ViewMode } from "@/lib/color";
import { createRecognizer, speak, stopSpeaking, type Recognizer } from "@/lib/voice";
import { describeImageWithAI } from "@/lib/ai";

type Route = "landing" | "studio" | "lab" | "docs";

const TABS: { id: Exclude<Route, "landing">; label: string; path: string; icon: typeof ImageIcon }[] = [
  { id: "studio", label: "Studio", path: "/studio", icon: ImageIcon },
  { id: "lab", label: "Contrast Lab", path: "/contrast-lab", icon: Contrast },
  { id: "docs", label: "Docs", path: "/docs", icon: BookOpen },
];

const PATH_TO_ROUTE: Record<string, Route> = {
  "/": "landing",
  "/studio": "studio",
  "/contrast-lab": "lab",
  "/docs": "docs",
};

const TITLES: Record<Route, string> = {
  landing: "ChromAssist — Understand colours with confidence",
  studio: "Studio · ChromAssist",
  lab: "Contrast Lab · ChromAssist",
  docs: "Docs · ChromAssist",
};

const routeFromPath = (path: string): Route => PATH_TO_ROUTE[path.replace(/\/+$/, "") || "/"] ?? "landing";

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
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname));
  const [src, setSrc] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("simulate");
  const [compare, setCompare] = useState(false);
  const [picked, setPicked] = useState<RGB | null>(null);
  const [palette, setPalette] = useState<RGB[]>([]);
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiElapsed, setAiElapsed] = useState(0);
  const aiAbort = useRef<AbortController | null>(null);

  const [cvd, setCvd] = useState<CVDType>(() => {
    try { return (localStorage.getItem('cvd') as CVDType) || "deuteranopia"; } catch { return "deuteranopia"; }
  });
  const [severity, setSeverity] = useState(() => {
    try { return Number(localStorage.getItem('severity')) || 1; } catch { return 1; }
  });
  const [voiceOut, setVoiceOut] = useState(() => {
    try { return localStorage.getItem('voiceOut') !== 'false'; } catch { return true; }
  });

  const fileRef = useRef<HTMLInputElement | null>(null);
  const prevUrl = useRef<string | null>(null);
  const recRef = useRef<Recognizer | null>(null);

  useEffect(() => { try { localStorage.setItem('cvd', cvd); } catch {} }, [cvd]);
  useEffect(() => { try { localStorage.setItem('severity', severity.toString()); } catch {} }, [severity]);
  useEffect(() => { try { localStorage.setItem('voiceOut', voiceOut.toString()); } catch {} }, [voiceOut]);

  /* ---- routing: real URLs so views are linkable and Back works ---- */
  const navigate = useCallback((path: string, replace = false) => {
    if (window.location.pathname !== path) {
      if (replace) window.history.replaceState({}, "", path);
      else window.history.pushState({}, "", path);
    }
    setRoute(routeFromPath(path));
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => { document.title = TITLES[route]; }, [route]);

  const flash = useCallback((msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 2400); }, []);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { flash("That file is not an image."); return; }
    if (file.size > 10 * 1024 * 1024) { flash("Image is too large. Max size is 10MB."); return; }
    const url = URL.createObjectURL(file);
    if (prevUrl.current?.startsWith("blob:")) URL.revokeObjectURL(prevUrl.current);
    prevUrl.current = url; setSrc(url); setPicked(null); setPalette([]); setAiText(null); setAiError(null);
  }, [flash]);

  const handlePick = useCallback((rgb: RGB) => {
    setPicked(rgb);
    if (voiceOut) speak(closestName(rgb).name);
  }, [voiceOut]);

  const handleLoad = useCallback((p: RGB[]) => setPalette(p), []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) { loadFile(file); navigate("/studio"); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFile, navigate]);

  const handleCommand = useCallback((t: string) => {
    const has = (...w: string[]) => w.some((x) => t.includes(x));
    if (has("upload", "open image", "scan image")) fileRef.current?.click();
    else if (has("simulate", "simulation")) { setMode("simulate"); speak("Simulation on"); }
    else if (has("enhance", "daltoni", "correct")) { setMode("daltonize"); speak("Enhancement on"); }
    else if (has("original", "normal view", "turn off")) { setMode("original"); speak("Original view"); }
    else if (has("protan")) { setCvd("protanopia"); speak("Protanopia profile selected"); }
    else if (has("deutan")) { setCvd("deuteranopia"); speak("Deuteranopia profile selected"); }
    else if (has("tritan")) { setCvd("tritanopia"); speak("Tritanopia profile selected"); }
    else if (has("describe", "what colour", "what color", "read colour")) {
      speak(picked ? closestName(picked).name : "Nothing picked yet. Tap the image first.");
    }
    else if (has("contrast")) { navigate("/contrast-lab"); speak("Opening contrast lab"); }
    else if (has("stop", "quiet", "silence", "mute")) { setVoiceOut(false); stopSpeaking(); }
    else speak("Sorry, I did not catch that.");
  }, [picked, navigate]);

  useEffect(() => { recRef.current = createRecognizer(handleCommand, setListening); }, [handleCommand]);

  const toggleMic = () => {
    const rec = recRef.current;
    if (!rec?.supported) { flash("Speech recognition is not available in this browser."); return; }
    if (listening) rec.stop(); else rec.start();
  };

  const toggleVoice = () => { if (voiceOut) stopSpeaking(); setVoiceOut((v) => !v); };

  const loadSample = () => {
    const url = makeTestImage();
    if (prevUrl.current?.startsWith("blob:")) URL.revokeObjectURL(prevUrl.current);
    prevUrl.current = url; setSrc(url); setPicked(null); setPalette([]); setAiText(null); setAiError(null); navigate("/studio");
  };

  const cancelAi = () => { aiAbort.current?.abort(); };

  const runAiDescribe = async () => {
    if (!src) { flash("Upload an image first."); return; }
    aiAbort.current?.abort();
    const controller = new AbortController();
    aiAbort.current = controller;
    setAiLoading(true); setAiText(null); setAiError(null); setAiElapsed(0);
    const started = Date.now();
    const ticker = window.setInterval(() => setAiElapsed(Math.round((Date.now() - started) / 1000)), 1000);
    try {
      const text = await describeImageWithAI({ imageSrc: src, cvd, severity, picked, signal: controller.signal });
      setAiText(text);
      if (voiceOut) speak(text);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "The AI request failed.");
    } finally {
      window.clearInterval(ticker);
      setAiLoading(false);
      aiAbort.current = null;
    }
  };

  useEffect(() => () => aiAbort.current?.abort(), []);

  const micSupported = useMemo(() => typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition), []);

  if (route === "landing") {
    return <LandingPage onEnterApp={() => navigate("/studio")} />;
  }

  const activeTab = TABS.find((t) => t.id === route);

  return (
    <div className="flex min-h-full flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white focus:font-semibold">
        Skip to content
      </a>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ""; }} />
      <header className="sticky top-0 z-30 border-b border-white/8 bg-void/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 text-left" aria-label="ChromAssist home">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2 shadow-lg shadow-accent/25"><Sparkles className="h-4 w-4 text-white" /></span>
            <span className="leading-tight"><span className="block text-sm font-semibold tracking-tight text-white">ChromAssist</span><span className="hidden text-[11px] text-muted sm:block">Colour vision assistance</span></span>
          </button>
          <nav aria-label="Sections" className="ml-4 hidden items-center gap-1 rounded-xl bg-black/40 p-1 ring-1 ring-white/8 md:flex">
            {TABS.map(({ id, label, path, icon: Icon }) => (
              <button key={id} onClick={() => navigate(path)} aria-current={activeTab?.id === id ? "page" : undefined} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab?.id === id ? "bg-white/10 text-white" : "text-muted hover:text-zinc-200"}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={toggleVoice} aria-pressed={voiceOut} className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition ${voiceOut ? "border-accent/40 bg-accent/15 text-white" : "border-white/10 text-muted hover:text-zinc-200"}`}>
              {voiceOut ? <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> : <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />}<span className="hidden sm:inline">{voiceOut ? "Voice on" : "Voice off"}</span>
            </button>
            <button onClick={toggleMic} disabled={!micSupported} aria-pressed={listening} className={`relative flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition disabled:opacity-40 ${listening ? "border-rose-400/50 bg-rose-500/15 text-rose-200" : "border-white/10 text-muted hover:text-zinc-200"}`}>
              {listening && <span className="absolute inset-0 -z-10 rounded-xl bg-rose-500/20 animate-ring" aria-hidden="true" />}
              {listening ? <Mic className="h-3.5 w-3.5" aria-hidden="true" /> : <MicOff className="h-3.5 w-3.5" aria-hidden="true" />}<span className="hidden sm:inline">{listening ? "Listening" : "Commands"}</span>
            </button>
            <button onClick={() => fileRef.current?.click()} aria-label="Upload an image" className="flex h-9 items-center gap-1.5 rounded-xl bg-white px-3.5 text-xs font-semibold text-void transition hover:bg-zinc-200"><ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /><span className="hidden sm:inline">Upload</span></button>
          </div>
        </div>
        <nav aria-label="Sections" className="flex gap-1 overflow-x-auto border-t border-white/8 px-4 py-2 md:hidden">
          {TABS.map(({ id, label, path, icon: Icon }) => (
            <button key={id} onClick={() => navigate(path)} aria-current={activeTab?.id === id ? "page" : undefined} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab?.id === id ? "bg-white/10 text-white" : "text-muted"}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</button>
          ))}
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
        <h1 className="sr-only">{activeTab?.label ?? "ChromAssist"}</h1>
        {route === "studio" && (
          <div key="studio" className="grid animate-rise gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Stage src={src} mode={mode} cvd={cvd} severity={severity} compare={compare} onPick={handlePick} onLoad={handleLoad} onDropFile={loadFile} onRequestUpload={() => fileRef.current?.click()} />
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.capture = "environment"; input.onchange = () => { const f = input.files?.[0]; if (f) loadFile(f); }; input.click(); }} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5"><Camera className="h-3.5 w-3.5" aria-hidden="true" />Camera</button>
                <button onClick={loadSample} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />Test image</button>
                <button onClick={runAiDescribe} disabled={!src || aiLoading} className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/15 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-accent/25 disabled:opacity-40"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />{aiLoading ? `Asking AI… ${aiElapsed}s` : "Ask AI"}</button>
                {src && (<button onClick={() => { if (prevUrl.current?.startsWith("blob:")) URL.revokeObjectURL(prevUrl.current); prevUrl.current = null; setSrc(null); setPicked(null); setPalette([]); setAiText(null); setAiError(null); }} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-muted transition hover:bg-white/5 hover:text-zinc-200"><X className="h-3.5 w-3.5" aria-hidden="true" />Clear</button>)}
                <span className="ml-auto hidden text-[11px] text-muted sm:block">Drop · paste · or use arrow keys on the canvas</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                Colour detection and simulation run on your device. <strong className="font-semibold text-zinc-300">Ask AI</strong> is optional: it sends a downscaled copy of this image to our server, which forwards it to Google&rsquo;s Gemini model.
              </p>
            </div>
            <aside className="space-y-4 lg:sticky lg:top-[76px] lg:self-start">
              <Controls cvd={cvd} onCvd={setCvd} severity={severity} onSeverity={setSeverity} mode={mode} onMode={setMode} compare={compare} onCompare={setCompare} />
              <Readout picked={picked} cvd={cvd} severity={severity} palette={palette} onSelect={(c) => { setPicked(c); navigate("/contrast-lab"); }} />
              {aiLoading && (
                <section className="animate-rise rounded-3xl glass p-5" aria-busy="true">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">AI explanation</h2>
                    <button onClick={cancelAi} className="text-[11px] text-slate-600 underline underline-offset-2 hover:text-slate-900">Cancel</button>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">Waiting for the vision model… {aiElapsed}s. This can take up to a minute; you can cancel and keep using the readout.</p>
                </section>
              )}
              {aiError && (
                <section className="animate-rise rounded-3xl glass p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700">AI explanation failed</h2>
                    <button onClick={() => setAiError(null)} className="text-[11px] text-slate-600 underline underline-offset-2 hover:text-slate-900">Dismiss</button>
                  </div>
                  <p role="alert" className="text-sm leading-relaxed text-slate-700">{aiError}</p>
                  <button onClick={runAiDescribe} className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50">Try again</button>
                </section>
              )}
              {aiText && (
                <section className="animate-rise rounded-3xl glass p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">AI explanation</h2>
                    <button onClick={() => setAiText(null)} className="text-[11px] text-slate-600 underline underline-offset-2 hover:text-slate-900">Dismiss</button>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">{aiText}</p>
                </section>
              )}
            </aside>
          </div>
        )}
        {route === "lab" && <div key="lab" className="animate-rise"><ContrastLab palette={palette} /></div>}
        {route === "docs" && <div key="docs" className="animate-rise"><Docs /></div>}
      </main>
      <footer className="border-t border-white/8 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 text-[11px] text-muted">
          <span>Studio, Contrast Lab and Docs run entirely in your browser. Only Ask AI sends a downscaled image to our server.</span>
          <span className="ml-auto flex items-center gap-1.5"><Github className="h-3.5 w-3.5" aria-hidden="true" />MIT licensed</span>
        </div>
      </footer>
      {toast && (<div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-rise rounded-xl border border-white/12 bg-panel/95 px-4 py-2.5 text-xs text-zinc-200 shadow-2xl backdrop-blur">{toast}</div>)}
    </div>
  );
}
