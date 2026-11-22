import { useEffect, useRef, useState } from 'react';
import { getPref, setPref } from './storage';

const SR: any = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : undefined;
export const canListen = !!SR;
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useDictation(onText: (t: string) => void) {
  const [on, setOn] = useState(false);
  const rec = useRef<any>(null);
  const toggle = () => {
    if (!SR) return;
    if (on) { rec.current?.stop(); return; }
    const r = new SR(); r.lang = navigator.language || 'en-US'; r.interimResults = false; r.continuous = false;
    r.onresult = (e: any) => onText(Array.from(e.results).map((x: any) => x[0].transcript).join(' '));
    r.onend = () => setOn(false); r.onerror = () => setOn(false);
    rec.current = r; r.start(); setOn(true);
  };
  return { on, toggle };
}

export function useSpeech() {
  const [enabled, setEnabled] = useState(getPref('speak', '0') === '1');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState(getPref('voice', ''));
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
