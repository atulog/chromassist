export const speechOutputSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string) {
  if (!speechOutputSupported() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.03;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /Google UK English Female|Samantha|Microsoft Aria|Zira|Karen/i.test(v.name)) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("en"));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  } catch {
    /* no-op */
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* no-op */
  }
}

export type Recognizer = {
  supported: boolean;
  start: () => void;
  stop: () => void;
};

export function createRecognizer(
  onResult: (transcript: string) => void,
  onListeningChange: (listening: boolean) => void
): Recognizer {
  const w = window as unknown as {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) return { supported: false, start: () => {}, stop: () => {} };

  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = "en-US";
  rec.onstart = () => onListeningChange(true);
  rec.onend = () => onListeningChange(false);
  rec.onerror = () => onListeningChange(false);
  rec.onresult = (e: any) => {
    const last = e.results[e.results.length - 1];
    if (last?.isFinal) onResult(String(last[0].transcript).toLowerCase().trim());
  };

  return {
    supported: true,
    start() {
      try {
        rec.start();
      } catch {
        /* already started */
      }
    },
    stop() {
      try {
        rec.stop();
      } catch {
        /* no-op */
      }
    },
  };
}