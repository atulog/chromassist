import { useEffect, useState } from "react";
import { ArrowRight, Camera, Image as ImageIcon, Mic, ShieldCheck, CheckCircle2, Type } from "lucide-react";

type Props = { onEnterApp: () => void };

const TEXT_SIZES = [100, 112, 125];

const PHOTO = "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop";

export default function LandingPage({ onEnterApp }: Props) {
  // Real text-size control: scales the root font size, which every rem-based size follows.
  const [textScale, setTextScale] = useState(() => {
    try { return Number(localStorage.getItem("textScale")) || 100; } catch { return 100; }
  });

  useEffect(() => {
    document.documentElement.style.fontSize = textScale === 100 ? "" : `${textScale}%`;
    try { localStorage.setItem("textScale", String(textScale)); } catch {}
  }, [textScale]);

  const bumpTextSize = () => {
    const next = TEXT_SIZES[(TEXT_SIZES.indexOf(textScale) + 1) % TEXT_SIZES.length];
    setTextScale(next);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:font-semibold">
        Skip to content
      </a>

      {/* 1. Navbar */}
      <nav aria-label="Main" className="flex items-center justify-between gap-4 px-5 sm:px-8 py-4 max-w-7xl mx-auto border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div aria-hidden="true" className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold">C</div>
          <span className="font-bold text-xl tracking-tight">ChromAssist</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
          <a href="#" className="text-slate-900">Home</a>
          <a href="#how-it-works" className="hover:text-blue-700 transition">How It Works</a>
          <a href="#about" className="hover:text-blue-700 transition">About</a>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <button
            type="button"
            onClick={bumpTextSize}
            aria-label={`Text size: ${textScale} percent. Activate to make text larger.`}
            title={`Text size: ${textScale}%`}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Type className="h-4 w-4" aria-hidden="true" />
            <span aria-hidden="true">Aa</span>
            <span className="sr-only">{textScale}%</span>
          </button>
        </div>
      </nav>

      <main id="main">
        {/* 2. Hero Section */}
        <header className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-6">
              Colour science + AI assistance
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-900">
              Understand colours <br className="hidden sm:block" /> with greater confidence.
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-md leading-relaxed">
              ChromAssist helps people with colour vision deficiency identify colours using clear text labels and accessible visual cues.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={onEnterApp} className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition flex items-center gap-2 shadow-lg shadow-blue-600/20">
                Open the Studio <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <a href="#how-it-works" className="px-6 py-3 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-2">
                How It Works
              </a>
            </div>
          </div>

          {/* Hero Mockup Card */}
          <div className="relative">
            <div aria-hidden="true" className="absolute inset-0 bg-blue-200 rounded-3xl blur-3xl opacity-40 transform rotate-2" />
            <div className="relative bg-white p-4 sm:p-5 rounded-3xl shadow-xl border border-slate-200">
              <div className="aspect-[4/3] bg-slate-900 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
                <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url('${PHOTO}')` }} />
                <div className="absolute top-4 right-4 bg-white shadow-sm px-3 py-1.5 rounded-md text-xs font-bold text-emerald-700 border border-emerald-200">GREEN · leaf</div>
                <div aria-hidden="true" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white rounded-xl" />
              </div>
              <div className="flex justify-between items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">HEX</div>
                  <div className="font-mono font-bold text-slate-900 text-sm">#1C3B2C</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">RGB</div>
                  <div className="font-mono font-bold text-slate-900 text-sm">28, 59, 44</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Name</div>
                  <div className="font-bold text-slate-900 text-sm">Forest green</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Preview of the colour readout */}
        <section aria-labelledby="preview-heading" className="bg-white py-16 sm:py-20 border-y border-slate-200">
          <div className="max-w-4xl mx-auto px-5 sm:px-8">
            <h2 id="preview-heading" className="text-2xl font-bold mb-2 text-center text-slate-900">What the Studio shows you</h2>
            <p className="text-center text-sm text-slate-600 mb-8">
              An illustration of the readout. The Studio runs the real thing on your own image — on your device.
            </p>

            <div className="bg-[#F8FAFC] rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Sample image */}
                <div className="bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col justify-between gap-4 p-4 min-h-[260px]">
                  <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url('${PHOTO}')` }} />
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur">Example image</span>
                  </div>
                  <div aria-hidden="true" className="relative z-10 flex justify-center items-center h-full">
                    <div className="w-32 h-32 border-2 border-white rounded-xl" />
                  </div>
                  <div className="relative z-10 flex flex-wrap justify-center gap-3">
                    <button onClick={onEnterApp} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg hover:bg-slate-100">
                      <Camera className="w-4 h-4" aria-hidden="true" /> Use your camera
                    </button>
                    <button onClick={onEnterApp} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg hover:bg-slate-100">
                      <ImageIcon className="w-4 h-4" aria-hidden="true" /> Upload an image
                    </button>
                  </div>
                </div>

                {/* Detection Result */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Detected colour</h3>
                    <div className="flex items-center gap-4 mb-6">
                      <div aria-hidden="true" className="w-16 h-16 rounded-full bg-[#1C3B2C] ring-4 ring-emerald-50" />
                      <span className="text-3xl font-bold text-slate-900">Forest green</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                        <span className="text-slate-600 text-sm font-medium">HEX</span>
                        <span className="font-mono font-bold text-slate-900">#1C3B2C</span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                        <span className="text-slate-600 text-sm font-medium">RGB</span>
                        <span className="font-mono font-bold text-slate-900">28, 59, 44</span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                        <span className="text-slate-600 text-sm font-medium">Contrast on white</span>
                        <span className="font-mono font-bold text-slate-900">12.4:1</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Mic className="w-4 h-4 text-blue-700" aria-hidden="true" /> Speaks the colour name
                    </div>
                    <button onClick={onEnterApp} className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap">
                      Try it
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. About Section */}
        <section id="about" aria-labelledby="about-heading" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-20 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Phone mockup */}
          <div className="order-2 md:order-1 relative flex justify-center">
            <button onClick={onEnterApp} aria-label="Open the ChromAssist Studio" className="block w-56 sm:w-64 h-[420px] sm:h-[500px] rounded-[2.5rem] border-[8px] border-slate-800 relative shadow-2xl overflow-hidden bg-slate-900 focus-visible:outline-blue-600">
              <span aria-hidden="true" className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl w-32 mx-auto z-10" />
              <span aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${PHOTO}')` }} />
              <span className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-xl shadow-lg text-emerald-700 font-bold text-sm">Forest green</span>
              <span aria-hidden="true" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-44 h-44 border-2 border-white rounded-xl" />
            </button>
          </div>

          {/* Text Content */}
          <div className="order-1 md:order-2">
            <h2 id="about-heading" className="text-3xl font-bold mb-4 text-slate-900">About ChromAssist</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              ChromAssist helps people with colour vision deficiency identify colours from a camera or an uploaded image, using clear text labels, spoken names and accessible visual cues. The colour maths runs entirely in your browser.
            </p>

            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" /> Key features</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" /> Pixel-accurate colour naming</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" /> CVD simulation and daltonization</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" /> Text, voice and keyboard support</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-700" aria-hidden="true" /> In the Studio</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" /> Four vision profiles</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" /> Contrast lab with CIEDE2000</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" /> Optional AI second opinion</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. How It Works Section */}
        <section id="how-it-works" aria-labelledby="how-heading" className="bg-white py-16 sm:py-20 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <h2 id="how-heading" className="text-2xl font-bold text-center mb-12 text-slate-900">How It Works</h2>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 text-center">
              {[
                { icon: Camera, title: "1. Capture", desc: "Use your camera or upload an image." },
                { icon: ImageIcon, title: "2. Identify", desc: "ChromAssist analyses the selected visual information." },
                { icon: Mic, title: "3. Understand", desc: "Read the colour label or hear it spoken." }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
                  <div aria-hidden="true" className="w-16 h-16 rounded-2xl bg-white shadow-sm text-blue-700 flex items-center justify-center mb-6">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">{step.title}</h3>
                  <p className="text-slate-600 text-sm max-w-[220px]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-5 text-center text-slate-600 text-sm bg-white">
        <p className="mx-auto flex max-w-2xl items-start justify-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>Colour analysis runs on your device — images are not uploaded. Only the optional <strong className="font-semibold">Ask AI</strong> button in the Studio sends a downscaled copy to our server.</span>
        </p>
        <p>© 2026 ChromAssist. Because every colour matters.</p>
      </footer>
    </div>
  );
}
