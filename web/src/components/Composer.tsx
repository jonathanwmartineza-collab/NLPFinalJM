import { useEffect, useRef, useState } from 'react';
import { canListen, useDictation } from '../lib/voice';
import { BUDGET } from '../ai/models';

// The longest message the on-device model reads in full. The box never cuts a paste: it shows the count and
// blocks Send with a clear message instead (a real-model test found a paste silently cut, and the model then
// invented the missing ending).
const MAX = BUDGET.inputChars;
const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

export default function Composer({ placeholder, busy, onSend, onStop, seed, clear }: {
  placeholder: string; busy: boolean; onSend: (t: string) => void; onStop: () => void; seed?: { text: string; n: number };
  /** The red Clear button, shown beside Send and Stop. */
  clear?: React.ReactNode;
}) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const dict = useDictation((t) => setText((v) => (v ? `${v} ${t}` : t)));
  useEffect(() => { if (seed?.text) { setText(seed.text); ref.current?.focus(); } }, [seed?.n]);
  const send = () => { const t = text.trim(); if (!t || busy || t.length > MAX) return; onSend(t); setText(''); };
  // The second click of a double-click on Send (detail 2) lands on the Stop button that replaced it: ignore it.
  const stop = (e: React.MouseEvent) => { if (e.detail > 1) return; onStop(); };
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
        <textarea id="composer" ref={ref} value={text} rows={2} maxLength={200_000} aria-describedby="composer-count"
          placeholder={placeholder} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !touch && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
        {clear}
        {busy
          ? <button type="button" className="btn ghost" onClick={stop}>Stop</button>
          : <button type="button" className="btn" onClick={send} disabled={!text.trim() || text.length > MAX}>Send</button>}
      </div>
      <div className="composer-foot">
        <span>{touch ? 'Tap Send to send.' : 'Enter to send, Shift+Enter for a new line.'}</span>
        <span id="composer-count" aria-live="polite" style={{ color: text.length > MAX ? 'var(--err)' : undefined }}>
          {text.length > MAX ? `Too long for the on-device AI: ${text.length.toLocaleString()} of ${MAX.toLocaleString()} characters. Remove ${(text.length - MAX).toLocaleString()} characters or send it in parts; nothing was cut.` : text.length > MAX * 0.5 ? `${text.length.toLocaleString()} / ${MAX.toLocaleString()} characters` : ''}
        </span>
      </div>
    </div>
  );
}
