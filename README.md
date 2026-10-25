# ChromAssist

> Browser-based assistive tool for color-vision deficiency.

Live simulation Â· Daltonization enhancement Â· pixel identification Â· WCAG contrast checks Â· CIEDE2000 confusable-pair detection Â· voice descriptions Â· voice commands Â· AI image explanations.

## Features

- 4 CVD profiles with continuous severity slider â€” protanopia, deuteranopia, tritanopia, achromatopsia
- Three render modes â€” Original, Simulate, Enhance (Daltonization)
- Side-by-side compare between original and processed
- Pixel-accurate magnifier on hover; keyboard cursor for accessibility
- Color identification â€” hex, RGB, HSL, closest named color (CIE Lab, 120-entry corpus)
- Contrast checker â€” WCAG 2.1 AA / AAA against black and white
- Pair checker â€” CIEDE2000 distance under each CVD profile to catch confusable pairs
- Voice output â€” speaks color descriptions and AI explanations
- Voice commands â€” hands-free control ("simulate", "enhance", "describe", "contrast")
- Ask AI â€” Gemini describes which elements are confusing for your profile and how to fix them
- In-app documentation â€” full mini-project write-up

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

## Build & deploy

    npm run build
    npm start

Deploys cleanly to Cloud Run, Fly.io, Railway, or any Node host.

## References

- Machado, Oliveira & Fernandes (2009). A physiologically-based model for simulation of color vision deficiency. IEEE TVCG 15(6).
- Sharma, Wu & Dalal (2005). The CIEDE2000 color-difference formula. Color Res. & App. 30(1).
- W3C (2018). WCAG 2.1 â€” Success Criterion 1.4.3.

## License

MIT