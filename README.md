# ChromAssist
Browser-based assistive tool for color-vision deficiency.

Live simulation | Daltonization enhancement | pixel identification | WCAG contrast checks | CIEDE2000 confusable-pair detection | voice descriptions | voice commands | AI image explanations.

## Features
- 4 CVD profiles with continuous severity slider (protanopia, deuteranopia, tritanopia, achromatopsia)
- Three render modes (Original, Simulate, Enhance/Daltonization)
- Side-by-side compare between original and processed
- Pixel-accurate magnifier on hover; keyboard cursor for accessibility
- Color identification (hex, RGB, HSL, closest named color via CIE Lab)
- Contrast checker (WCAG 2.1 AA / AAA against black and white)
- Pair checker (CIEDE2000 distance under each CVD profile)
- Voice output (speaks color descriptions and AI explanations)
- Voice commands (hands-free control: "simulate", "enhance", "describe", "contrast")
- Ask AI (Gemini describes which elements are confusing for your profile)
- In-app documentation (full mini-project write-up)

Everything except the AI call runs client-side. Images never leave the browser unless you click Ask AI.

## Run locally
Prerequisites: Node.js 20+

    git clone <your-repo>
    cd chromassist
    npm install
    cp .env.example .env.local
    # edit .env.local and set GEMINI_API_KEY
    npm run dev

- Client: http://localhost:3000
- API: http://localhost:3001

## Build and Deploy
    npm run build
    npm start

Deploys cleanly to Cloud Run, Fly.io, Railway, or any Node host.

## References
- Machado, Oliveira and Fernandes (2009). A physiologically-based model for simulation of color vision deficiency. IEEE TVCG 15(6).
- Sharma, Wu and Dalal (2005). The CIEDE2000 color-difference formula. Color Res. and App. 30(1).
- W3C (2018). WCAG 2.1 - Success Criterion 1.4.3.

## License
MIT