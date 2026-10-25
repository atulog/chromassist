import type { CVDType, RGB } from './color';
import { closestName, hexOf } from './color';

async function imageToBase64(src: string): Promise<{ base64: string; mimeType: string }> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('Failed to load image'));
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

export async function describeImageWithAI(args: {
  imageSrc: string;
  cvd: CVDType;
  severity: number;
  picked: RGB | null;
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

  const res = await fetch('/api/describe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server responded ${res.status}`);
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}