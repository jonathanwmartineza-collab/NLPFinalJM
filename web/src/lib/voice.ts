import { useEffect, useRef, useState } from 'react';
import { getPref, setPref } from './storage';

const SR: any = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : undefined;
export const canListen = !!SR;
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

type Results = ArrayLike<ArrayLike<{ transcript: string }>>;

/** The words heard so far in one listening session. Each result event carries the whole list of results so far,
 * and a later event replaces the partial ones, so this is read from the latest event only, never added up. */
export function sessionText(results: Results): string {
  return Array.from(results).map((r) => r[0]?.transcript.trim() ?? '').filter(Boolean).join(' ');
}

/** One press of the mic = one listening session = one piece of text, handed over once when listening ends.
 * Chrome 158 on a Mac sends partial results ("Red", "Red green", "Red green blue") even with interimResults off,
 * and the old code added each event to the box, so three words came out about six times each. */
export function createDictation(Recognizer: any, onText: (t: string) => void, onState: (on: boolean) => void) {
  let current: any = null;
  const toggle = () => {
    if (current) { current.stop(); return; }
    const r = new Recognizer();
    r.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
    r.interimResults = false; r.continuous = false;
    let heard = '';
    r.onresult = (e: any) => { if (current === r) heard = sessionText(e.results); };
    // Chrome fires error and then end; the guard makes sure the text is handed over once.
    const finish = () => { if (current !== r) return; current = null; onState(false); if (heard) onText(heard); };
    r.onend = finish; r.onerror = finish;
    current = r; r.start(); onState(true);
  };
  // Leaving the page drops a session in progress without adding its words anywhere.
  const dispose = () => { const r = current; current = null; r?.abort?.(); };
  return { toggle, dispose };
}

export function useDictation(onText: (t: string) => void) {
  const [on, setOn] = useState(false);
  const cb = useRef(onText); cb.current = onText;
  const d = useRef<ReturnType<typeof createDictation> | null>(null);
  if (!d.current && SR) d.current = createDictation(SR, (t) => cb.current(t), setOn);
  useEffect(() => () => d.current?.dispose(), []);
  return { on, toggle: () => d.current?.toggle() };
}

export function useSpeech() {
  const [enabled, setEnabled] = useState(getPref('speak', '0') === '1');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState(getPref('voice', ''));
  // Stop reading aloud when the visitor leaves this chat (another expert, the Studio, …).
  useEffect(() => () => { if (canSpeak) speechSynthesis.cancel(); }, []);
  useEffect(() => {
    if (!canSpeak) return;
    const load = () => setVoices(speechSynthesis.getVoices());
    load(); speechSynthesis.addEventListener('voiceschanged', load);
    return () => speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);
  const speak = (markdown: string) => {
    if (!canSpeak || !enabled) return;
    const text = markdown.replace(/```[\s\S]*?```/g, ' code block omitted. ').replace(/[#*_`>|-]/g, ' ').replace(/\s+/g, ' ').slice(0, 4000);
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find((x) => x.name === voice); if (v) u.voice = v;
    speechSynthesis.speak(u);
  };
  return {
    enabled, voices, voice, speak,
    setEnabled: (b: boolean) => { setEnabled(b); setPref('speak', b ? '1' : '0'); if (!b && canSpeak) speechSynthesis.cancel(); },
    setVoice: (n: string) => { setVoice(n); setPref('voice', n); },
  };
}
