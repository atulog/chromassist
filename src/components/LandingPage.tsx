import { ArrowRight, Camera, Image as ImageIcon, Link as LinkIcon, Mic, Moon, ShieldCheck, Sun, CheckCircle2 } from "lucide-react";

export default function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const handleMockupClick = () => {
    alert("Redirecting you to the main ChromAssist Studio...");
    onEnterApp();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* 1. Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold">C</div>
          <span className="font-bold text-xl tracking-tight">ChromAssist</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
          <a href="#" className="text-slate-900">Home</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition">How It Works</a>
          <a href="#about" className="hover:text-blue-600 transition">About</a>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span className="text-sm font-semibold cursor-pointer hover:text-slate-900">Aa</span>
          <Moon className="w-5 h-5 cursor-pointer hover:text-slate-900" />
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="max-w-7xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-6">
            AI-Powered Accessibility
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-900">
            Understand colours <br /> with greater confidence.
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-md leading-relaxed">
            ChromAssist helps people with colour vision deficiency identify colours using clear text labels and accessible visual cues.
          </p>
          <div className="flex gap-4">
            <button onClick={onEnterApp} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20">
              Try Colour Detection <ArrowRight className="w-4 h-4" />
            </button>
            <a href="#how-it-works" className="px-6 py-3 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-2">
              How It Works
            </a>
          </div>
        </div>
        
        {/* Hero Mockup Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-200 rounded-3xl blur-3xl opacity-40 transform rotate-2" />
          <div className="relative bg-white p-5 rounded-3xl shadow-xl border border-slate-100">
            <div className="aspect-[4/3] bg-slate-900 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
               {/* Simulated leaf image background */}
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-80" />
               <div className="absolute top-4 right-4 bg-white shadow-sm px-3 py-1.5 rounded-md text-xs font-bold text-emerald-600 border border-emerald-100">GREEN</div>
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white rounded-xl"></div>
            </div>
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HEX</div>
                <div className="font-mono font-bold text-slate-900 text-sm">#008000</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">RGB</div>
                <div className="font-mono font-bold text-slate-900 text-sm">0, 128, 0</div>
              </div>
              <button className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Feature Section (Colour Detection Mockup) */}
      <section className="bg-white py-20 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-2xl font-bold mb-8 text-center text-slate-900">Colour Detection</h2>
          
          <div className="bg-[#F8FAFC] rounded-3xl border border-slate-200 p-6 shadow-sm">
            {/* Tabs */}
            <div className="flex gap-4 mb-4 bg-slate-100 p-1.5 rounded-xl w-fit">
              <button onClick={handleMockupClick} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-semibold text-slate-900"><Camera className="w-4 h-4" /> Camera</button>
              <button onClick={handleMockupClick} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700"><ImageIcon className="w-4 h-4" /> Upload</button>
              <button onClick={handleMockupClick} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700"><LinkIcon className="w-4 h-4" /> Image URL</button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Camera View */}
              <div className="bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col justify-between p-4 aspect-video md:aspect-auto">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-70" />
                <div className="relative z-10 flex justify-between items-start">
                  <span className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Camera Active</span>
                </div>
                <div className="relative z-10 flex justify-center items-center h-full">
                  <div className="w-32 h-32 border-2 border-white rounded-xl"></div>
                </div>
                <div className="relative z-10 flex justify-center gap-4 mt-4">
                  <button onClick={handleMockupClick} className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg"><Camera className="w-5 h-5" /></button>
                  <button className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"><span className="w-4 h-4 bg-white rounded-sm" /></button>
                  <button className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg">↻</button>
                </div>
              </div>

              {/* Detection Result */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Detected Colour</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#008000] ring-4 ring-emerald-50"></div>
                    <span className="text-3xl font-bold text-slate-900">GREEN</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 text-sm font-medium">HEX</span>
                      <span className="font-mono font-bold text-slate-900">#008000</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 text-sm font-medium">RGB</span>
                      <span className="font-mono font-bold text-slate-900">0, 128, 0</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Mic className="w-4 h-4 text-blue-600" /> Voice Assistance</div>
                  <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. About Section */}
      <section id="about" className="max-w-7xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-16 items-center">
        {/* Phone Image Mockup */}
        <div className="order-2 md:order-1 relative flex justify-center">
           <div className="w-64 h-[500px] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-800 relative shadow-2xl overflow-hidden">
             <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl w-32 mx-auto z-10" />
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center" />
             <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-xl shadow-lg text-emerald-600 font-bold text-sm">GREEN</div>
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-xl" />
           </div>
        </div>

        {/* Text Content */}
        <div className="order-1 md:order-2">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">About ChromAssist</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            ChromAssist is an AI-based accessibility tool that helps people with colour vision deficiency identify colours using camera input, image analysis and clear text labels.
          </p>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Key Features</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Real-time colour detection</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Text and voice assistance</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Simple and easy to use</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Future Plans</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> AI-powered colour matching</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Custom accessibility settings</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Mobile app version</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="bg-white py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-2xl font-bold text-center mb-12 text-slate-900">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Camera, title: "1. Capture", desc: "Use your camera or upload an image." },
              { icon: ImageIcon, title: "2. Identify", desc: "ChromAssist analyses the selected visual information." },
              { icon: Mic, title: "3. Understand", desc: "Read the colour label or use voice assistance." }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm text-blue-600 flex items-center justify-center mb-6">
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-900">{step.title}</h3>
                <p className="text-slate-500 text-sm max-w-[200px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-slate-500 text-sm bg-white">
        <p className="flex items-center justify-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Private - Images never leave your device.</p>
        <p>© 2026 ChromAssist. Because every colour matters.</p>
      </footer>
    </div>
  );
}