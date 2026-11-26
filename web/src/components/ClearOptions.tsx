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
  return { button, panel };
}
