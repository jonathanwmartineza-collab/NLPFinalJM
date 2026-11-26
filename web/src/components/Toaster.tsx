import { useEffect, useRef } from 'react';
import { useToast, dismissToast, showToast } from '../lib/toast';

/** Bottom toast. Undo toasts move focus to their Undo button (Enter undoes, Escape closes); the 8-second timer
 *  pauses only while the pointer is over the toast, so the clear always becomes final. Focus goes back afterwards. */
export default function Toaster() {
  const t = useToast();
  const box = useRef<HTMLDivElement>(null);
  const undoBtn = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const start = (ms: number, id: number) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => dismissToast(id), ms); };
  useEffect(() => {
    if (!t) return;
    start(t.ms, t.id);
    if (t.undo) { returnTo.current = document.activeElement as HTMLElement | null; undoBtn.current?.focus(); }
    return () => window.clearTimeout(timer.current);
  }, [t?.id]);
  const giveBack = () => {
    const r = returnTo.current; returnTo.current = null;
    if (!r) return;
    const target = r.isConnected && !(r as HTMLButtonElement).disabled ? r : document.getElementById('main');
    target?.focus();
  };
  useEffect(() => { if (!t && (document.activeElement === document.body || !document.activeElement)) giveBack(); }, [t]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {t && (
        <div className="toast" ref={box}
          onMouseEnter={() => window.clearTimeout(timer.current)} onMouseLeave={() => start(t.ms, t.id)}
          onKeyDown={(e) => { if (e.key === 'Escape') dismissToast(t.id); }}>
          <span>{t.text}</span>
          {t.undo && <button ref={undoBtn} type="button" className="btn sm" onClick={() => { const u = t.undo!; dismissToast(t.id); u(); giveBack(); showToast('Restored.'); }}>Undo</button>}
          <button type="button" className="icon-btn" aria-label="Close message" onClick={() => { dismissToast(t.id); giveBack(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
