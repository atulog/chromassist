import type { CVDType, RGB } from './color';
import { closestName, hexOf } from './color';

const TIMEOUT_MS = 60_000;

async function imageToBase64(src: string): Promise<{ base64: string; mimeType: string }> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('That image could not be loaded for AI analysis.'));
    img.src = src;
  });

  const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);

  const dataUrl = c.toDataURL('image/png');
  return { base64: dataUrl.split(',')[1], mimeType: 'image/png' };
}

/** Human-readable text for a failed /api/describe call. */
function friendlyError(status: number, body: any): string {
  if (status === 503) return 'The AI model is busy or not configured on this deployment. Everything else in the Studio keeps working without it.';
  if (status === 429) return 'The AI service is rate limited right now. Try again in a minute.';
  if (status >= 500) return 'The AI service is unavailable right now. Nothing else in the Studio is affected.';
  return body?.error || `The AI request failed (HTTP ${status}).`;
}

export async function describeImageWithAI(args: {
  imageSrc: string;
  cvd: CVDType;
  severity: number;
  picked: RGB | null;
  /** Lets the UI cancel an in-flight request. */
  signal?: AbortSignal;
}): Promise<string> {
  const { base64, mimeType } = await imageToBase64(args.imageSrc);

  const payload = {
    imageBase64: base64,
    mimeType,
    cvd: args.cvd,
    severity: args.severity,
    hex: args.picked ? hexOf(args.picked) : undefined,
    name: args.picked ? closestName(args.picked).name : undefined,
  };

  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort();
  args.signal?.addEventListener('abort', onAbort);
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, TIMEOUT_MS);

  try {
    const res = await fetch('/api/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(friendlyError(res.status, body));
    }

    const data = (await res.json()) as { text?: string };
    const text = data.text?.trim();
    if (!text) throw new Error('The AI service returned an empty answer.');
    return text;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        timedOut
          ? `The AI model did not answer within ${TIMEOUT_MS / 1000} seconds. Try again, or use the colour readout — it needs no network.`
          : 'AI request cancelled.',
      );
    }
    throw err instanceof Error ? err : new Error('The AI request failed.');
  } finally {
    clearTimeout(timer);
    args.signal?.removeEventListener('abort', onAbort);
  }
}
