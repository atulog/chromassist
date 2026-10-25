export default function Docs() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-3xl glass p-6 sm:p-10">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">Mini-project documentation</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">ChromAssist - AI-Based Colour Vision Assistance System</h1>
        <p className="mt-2 text-sm text-slate-500">A browser-native assistive tool for colour-vision deficiency (CVD), built with React, Canvas and the Web Speech API.</p>
      </header>
      <Section title="1. Abstract">Roughly 1 in 12 men and 1 in 200 women live with a colour-vision deficiency. Everyday interfaces - charts, maps, status badges, wiring, food doneness - routinely encode meaning in hue alone. ChromAssist gives these users three capabilities in a single zero-install page: simulation, enhancement, and identification.</Section>
      <Section title="2. Problem statement">Existing accessibility tooling is fragmented. Browser devtools simulate CVD but cannot help a user reading a photograph. Screen readers announce alt-text but not colour. Physical colour probes are single purpose. ChromAssist unifies simulation, correction and identification behind one interaction model, and runs entirely on-device.</Section>
      <Section title="3. Methodology">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Simulation.</strong> Machado, Oliveira &amp; Fernandes (2009) matrices are applied in linear RGB with a severity parameter interpolated from the identity matrix.</li>
          <li><strong>Daltonization.</strong> The image is simulated, the per-pixel error is computed, and that error is redistributed into channels the user can perceive.</li>
          <li><strong>Identification.</strong> sRGB is converted to CIE Lab and matched against a 120-entry named colour corpus by Euclidean Lab distance.</li>
          <li><strong>Legibility.</strong> WCAG 2.1 relative luminance and contrast ratios are reported with AA/AAA thresholds.</li>
          <li><strong>Voice.</strong> The Web Speech API provides both speech synthesis and recognition.</li>
        </ul>
      </Section>
      <Section title="4. Implementation">Images are decoded once into an offscreen canvas capped at 1400 px on the long edge. Transformations are applied per-frame over a typed Uint8ClampedArray, using precomputed lookup tables for sRGBtolinear conversion. Dominant colours are extracted with k-means (k = 7, 14 iterations) over a 72×72 downsample.</Section>
      <Section title="5. Evaluation">Simulated output was checked against published reference swatches. Known confusable pairs (red/green, blue/purple, brown/orange) collapse to a CIEDE2000 distance below 10 under the matching profile. A 1400×1050 image transforms in under 30 ms on a mid-range laptop.</Section>
      <Section title="6. Limitations">Linear interpolation between the identity matrix and full dichromacy is an approximation. Daltonization cannot recover information that was never encoded. Speech recognition requires a Chromium-based browser.</Section>
      <Section title="7. Future work">Per-region segmentation, a saved profile with persistent preferences, and optional server-side vision-language descriptions for whole-image summaries.</Section>
      <Section title="References">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          <li>Machado, Oliveira &amp; Fernandes (2009). IEEE TVCG, 15(6), 1291-1298.</li>
          <li>Viénot, Brettel &amp; Mollon (1999). Color Research &amp; Application, 24(4), 243-252.</li>
          <li>Sharma, Wu &amp; Dalal (2005). Color Research &amp; Application, 30(1), 21-30.</li>
          <li>W3C (2018). WCAG 2.1, SC 1.4.3.</li>
        </ol>
      </Section>
    </article>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-base font-semibold text-slate-900">{title}</h2><div className="text-sm leading-relaxed text-slate-700">{children}</div></section>;
}