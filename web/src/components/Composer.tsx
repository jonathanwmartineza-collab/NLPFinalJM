import { useEffect, useRef, useState } from 'react';
import { canListen, useDictation } from '../lib/voice';

const MAX = 4000;
const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

export default function Composer({ placeholder, busy, onSend, onStop, seed }: {
  placeholder: string; busy: boolean; onSend: (t: string) => void; onStop: () => void; seed?: { text: string; n: number };
}) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const dict = useDictation((t) => setText((v) => (v ? `${v} ${t}` : t)));
  useEffect(() => { if (seed?.text) { setText(seed.text); ref.current?.focus(); } }, [seed?.n]);
  const send = () => { const t = text.trim(); if (!t || busy || t.length > MAX) return; onSend(t); setText(''); };
  return (
    <div>
      <div className="composer">
        {canListen && (
          <button type="button" className="mic" aria-pressed={dict.on} onClick={dict.toggle} title="Dictate (your browser may send audio to its speech service)">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>
            <span className="sr-only">{dict.on ? 'Stop dictation' : 'Ask by voice'}</span>
          </button>
        )}
        <label htmlFor="composer" className="sr-only">Your message</label>
        <textarea id="composer" ref={ref} value={text} rows={2} maxLength={MAX + 200}
          placeholder={placeholder} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !touch && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
        {busy
          ? <button type="button" className="btn ghost" onClick={onStop}>Stop</button>
          : <button type="button" className="btn" onClick={send} disabled={!text.trim() || text.length > MAX}>Send</button>}
      </div>
      <div className="composer-foot">
        <span>{touch ? 'Tap Send to send.' : 'Enter to send, Shift+Enter for a new line.'}</span>
        <span aria-live="polite" style={{ color: text.length > MAX ? 'var(--err)' : undefined }}>{text.length > MAX - 400 ? `${text.length} / ${MAX}` : ''}</span>
      </div>
    </div>
  );
}
