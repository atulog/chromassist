import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[chromassist] GEMINI_API_KEY not set Ã¢â‚¬â€ /api/describe will fail. Add it to .env.local');
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const app = express();
app.use(express.json({ limit: '25mb' }));

const CVD_NAMES: Record<string, string> = {
  protanopia: 'protanopia (red-blind)',
  deuteranopia: 'deuteranopia (green-blind)',
  tritanopia: 'tritanopia (blue-blind)',
  achromatopsia: 'achromatopsia (monochromacy)',
};

app.post('/api/describe', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }
    const { imageBase64, mimeType, cvd, severity, hex, name } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      cvd?: string;
      severity?: number;
      hex?: string;
      name?: string;
    };

    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

    const profile = CVD_NAMES[cvd ?? ''] ?? 'color vision deficiency';
    const sev = typeof severity === 'number' ? Math.round(severity * 100) : 100;
    const pick = hex ? `They last picked ${hex}${name ? ` (${name})` : ''}.` : '';

    const prompt = `You are an accessibility assistant for someone with ${profile} at ${sev}% severity. ${pick}

Look at the attached image and reply in 2-3 short sentences:
1. Which specific elements or color pairs in this image are likely to look confusing or identical for this user.
2. One concrete, actionable suggestion to tell them apart (e.g. use the label text, shape, or position Ã¢â‚¬â€ not just color).

Be specific about what is actually in the image. Do not include disclaimers. Do not say "I can see". Do not use bullet points.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || 'image/png', data: imageBase64 } },
          ],
        },
      ],
    });

    const text = response.text?.trim() || 'No description was returned.';
    res.json({ text });
  } catch (err) {
    console.error('[chromassist] /api/describe failed:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, gemini: !!apiKey });
});

const dist = path.join(__dirname, 'dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(dist, 'index.html'), (err) => {
    if (err) res.status(404).end();
  });
});


if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[chromassist] API on http://localhost:${PORT} (gemini: ${apiKey ? 'ready' : 'missing key'})`);
  });
}
export default app;


