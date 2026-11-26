import { useEffect, useId, useRef, useState } from 'react';
import { showToast } from '../lib/toast';
import { freeUpSpace, formatBytes } from '../lib/cleanup';

type Opts = {
  /** What "Clear" erases, in plain words, e.g. "this chat with Bastien". */
  what: string;
  /** False when there is nothing to clear yet. */
  canClear: boolean;
  /** True while the AI is answering (Clear waits for Stop or the end of the answer). */
  answering?: boolean;
  /** Erase the tool's work now and return a function that puts it back (used by Undo). */
  onClear: () => () => void;
  /** Reset this tool's on-screen state after "Free up space" (storage is already gone). */
  onFreed: () => void;
};

/**
 * Two-level clear options for a tool. Returns the trigger button (for the tool's header) and the panel
 * (rendered in the page flow, so it fits at 390px and is never clipped by a scrolling container).
 */
export function useClearOptions({ what, canClear, answering, onClear, onFreed }: Opts) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !dlg.current?.open) { setOpen(false); trigger.current?.focus(); } };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [open]);

  const clear = () => {
    const undo = onClear();
    setOpen(false);
    trigger.current?.focus();
    showToast(`Cleared ${what}.`, undo);
  };
  // The same Clear, for the red button beside Send and Stop (see ClearButton below).
  const quick = (label: string, focusId = 'composer') => (
    <ClearButton label={label} what={what} canClear={canClear} answering={!!answering} focusId={focusId}
      onClear={() => { const undo = onClear(); setOpen(false); showToast(`Cleared ${what}.`, undo); }} />
  );
  const askFree = () => { try { dlg.current?.showModal(); cancel.current?.focus(); } catch { /* no dialog support */ } };
  const free = async () => {
    setBusy(true);
    let freed: number | null = null;
    try { freed = await freeUpSpace(); } catch { /* best effort: whatever could be deleted is gone */ }
    finally { onFreed(); setBusy(false); dlg.current?.close(); setOpen(false); }
    trigger.current?.focus();
    showToast(freed === null
      ? 'Space freed. Your browser did not report how much. The AI model will download again next time.'
      : `Freed ${formatBytes(freed)}. The AI model will download again next time you turn the AI on.`);
  };

  const button = (
    <button ref={trigger} type="button" className="btn ghost sm" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
      Clear options
    </button>
  );
  const panel = open ? (
    <section id={id} className="clear-panel" aria-label="Clear options">
      <div className="clear-row">
        <button type="button" className="btn ghost" onClick={clear} disabled={!canClear}>Clear</button>
        <p className="clear-note">
          <b>Erases</b> {what} and its saved history. <b>Keeps</b> the downloaded AI model, your other work and your settings.
          <b> Next:</b> {canClear ? 'start a new idea right away. You can undo for 8 seconds.' : answering ? 'press Stop or wait for the answer to finish, then clear.' : 'nothing to clear yet.'}
        </p>
      </div>
      <div className="clear-row">
        <button type="button" className="btn ghost danger" onClick={askFree}>Free up space…</button>
        <p className="clear-note">
          <b>Erases</b> all chats, Studio pages, the downloaded AI model, caches and temporary files this site stored.
          <b> Keeps</b> your theme and contrast settings. <b>Next:</b> the model downloads again (about 1 GB) the next time you turn on the AI. We ask before deleting.
        </p>
      </div>
      <dialog ref={dlg} className="confirm" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`}>
        <h2 id={`${id}-t`}>Free up space?</h2>
        <p id={`${id}-d`}>This deletes all chats, Studio pages, the downloaded AI model, caches and temporary files from this browser. It can't be undone. Your theme and contrast settings stay. The model will download again next time you turn on the AI.</p>
        <div className="confirm-acts">
          <button ref={cancel} type="button" className="btn ghost" onClick={() => dlg.current?.close()} disabled={busy}>Cancel</button>
          <button type="button" className="btn danger" onClick={free} disabled={busy}>{busy ? 'Freeing space…' : 'Delete and free up space'}</button>
        </div>
      </dialog>
    </section>
  ) : null;
  return { button, panel, quick };
}

/**
 * Erase now, keep a copy for Undo: `apply` shows and saves a value (on screen and in saved history).
 * Returns the function the toast's Undo calls to put the whole conversation back, saved again.
 */
export function clearWithUndo<T>(current: T, empty: T, apply: (v: T) => void): () => void {
  apply(empty);
  let used = false;
  return () => { if (used) return; used = true; apply(current); };
}

/**
 * Red "Clear" button in the chat's input row, beside Send and Stop, so a long chat can be cleared without
 * scrolling up. Red outline, trash icon and the full words at every width (never colour alone, never icon only), spaced away from Send.
 * One press clears; the toast "Cleared … · Undo" is announced to screen readers and puts it all back for
 * 8 seconds. Hidden when there is nothing to clear; disabled while an answer is being written (Stop first).
 */
export function ClearButton({ label, what, canClear, answering, onClear, focusId }: {
  label: string; what: string; canClear: boolean; answering: boolean; onClear: () => void; focusId?: string;
}) {
  if (!canClear && !answering) return null;
  return (
    <button type="button" className="btn ghost danger clear-btn" disabled={!canClear}
      title={answering ? 'Press Stop first, then clear.' : `Erases ${what}. You can undo for 8 seconds.`}
      onClick={() => { onClear(); if (focusId) document.getElementById(focusId)?.focus(); }}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9zm4 2v8h2v-8h-2zm4 0v8h2v-8h-2z"/></svg>
      <span>{label}</span>
    </button>
  );
}
