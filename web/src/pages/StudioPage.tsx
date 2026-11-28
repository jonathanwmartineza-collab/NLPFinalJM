import { useEffect, useMemo, useRef, useState } from 'react';
import type { LibraryItem } from '../lib/types';
import { saveBuild, lastBuild, clearBuilds } from '../lib/storage';
import { useClearOptions } from '../components/ClearOptions';
import EngineGate from '../components/EngineGate';
import { useEngine } from '../ai/engine';
import { buildFromBrief, refineSpec, claudeCodePrompt } from '../ai/studio/generate';
import type { Spec } from '../ai/studio/spec';
import { inlinePhotos } from '../ai/studio/photos';

type Stage = 'idle' | 'write' | 'render' | 'done';
const WIDTHS = { Desktop: '100%', Tablet: '820px', Mobile: '390px' } as const;
type Version = { html: string; spec: Spec };

export default function StudioPage({ library }: { library: LibraryItem[] }) {
  const params = new URLSearchParams(location.search);
  const [templateId, setTemplateId] = useState(params.get('t') ?? '');
  const tpl = useMemo(() => library.find((p) => p.id === templateId), [library, templateId]);
  const [brief, setBrief] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [versions, setVersions] = useState<Version[]>([]);
  const [vi, setVi] = useState(0);
  const [stream, setStream] = useState('');
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [width, setWidth] = useState<keyof typeof WIDTHS>('Desktop');
  const [change, setChange] = useState('');
  const [cc, setCc] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [frameKey, setFrameKey] = useState(0);
  const ctrl = useRef<AbortController | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const ready = useEngine().status === 'ready';
  const busy = stage === 'write' || stage === 'render';
  const cur = versions[vi];
  const html = cur?.html ?? '';
  // The preview, download and copy get the photos as data: URIs (the sandbox can't load site paths); code view keeps the short paths.
  // Copy and download use the ready copy, so the click keeps its user gesture in Safari.
  const [inlined, setInlined] = useState({ src: '', out: '' });
  const shown = inlined.src === html ? inlined.out : '';

  useEffect(() => { if (tpl) setBrief(tpl.prompt); }, [tpl]);
  useEffect(() => {
    lastBuild().then((b: any) => {
      if (b?.v2 && Array.isArray(b.v2) && b.v2.length && !versions.length) { setVersions(b.v2); setVi(b.v2.length - 1); setBrief((x) => x || b.brief); setStage('done'); }
    });
  }, []);
  useEffect(() => () => ctrl.current?.abort(), []);
  // Sandbox handshake: the frame says "ready", we send the HTML. Only messages from our frame are accepted.
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.type !== 'ready') return;
      frame.current?.contentWindow?.postMessage({ type: 'render', html: shown }, '*');
    };
    addEventListener('message', on); return () => removeEventListener('message', on);
  }, [shown]);
  useEffect(() => {
    let live = true;
    if (!html) return;
    inlinePhotos(html).then((out) => { if (live) setInlined({ src: html, out }); });
    return () => { live = false; };
  }, [html]);
  useEffect(() => { if (shown) setFrameKey((k) => k + 1); }, [shown]);

  const persist = (vs: Version[], b = brief) => saveBuild({ id: 'current', brief: b, versions: vs.map((v) => v.html), v2: vs, at: Date.now() } as any);
  const reset = () => { ctrl.current?.abort(); setVersions([]); setVi(0); setBrief(''); setChange(''); setCc(''); setStream(''); setErr(''); setNote(''); setStage('idle'); setTemplateId(''); };
  const clear = useClearOptions({
    what: 'this Studio page, its versions and its brief',
    canClear: (versions.length > 0 || brief.trim().length > 0 || !!cc) && !busy,
    answering: busy,
    onClear: () => {
      const snap = { versions, vi, brief, change, cc, stage, templateId };
      reset(); clearBuilds();
      return () => {
        setVersions(snap.versions); setVi(snap.vi); setBrief(snap.brief); setChange(snap.change); setCc(snap.cc); setStage(snap.stage); setTemplateId(snap.templateId);
        if (snap.versions.length) persist(snap.versions, snap.brief);
      };
    },
    onFreed: reset,
  });

  async function generate() {
    setErr(''); setNote(''); setCc(''); setStream(''); setView('preview');
    const c = (ctrl.current = new AbortController());
    try {
      setStage('write');
      let acc = '';
      const r = await buildFromBrief(brief, (t) => { acc += t; setStream(acc); }, c.signal);
      setStage('render');
      const vs = [{ html: r.html, spec: r.spec }]; setVersions(vs); setVi(0); setStream('');
      await persist(vs);
      setStage('done');
      setNote(r.usedFallback ? 'The AI’s answer could not be read, so a starter page was built from your brief. Refine it, or try Generate again.' : 'Done. Review the text before you publish the page.');
    } catch (e) { fail(e); }
  }

  async function refine() {
    if (!change.trim() || !cur) return;
    setErr(''); setNote(''); setStream('');
    const c = (ctrl.current = new AbortController());
    try {
      setStage('write');
      let acc = '';
      const r = await refineSpec(cur.spec, change.trim(), (t) => { acc += t; setStream(acc); }, c.signal);
      const vs = [...versions.slice(0, vi + 1), { html: r.html, spec: r.spec }]; setVersions(vs); setVi(vs.length - 1); setChange(''); setStream('');
      await persist(vs);
      setStage('done'); setNote(`Version ${vs.length} ready.`);
    } catch (e) { fail(e); }
  }

  function fail(e: unknown) {
    setStage(versions.length ? 'done' : 'idle'); setStream('');
    const m = (e as Error)?.message || 'Something went wrong.';
    if ((e as Error).name === 'AbortError' || /stopped/i.test(m) || ctrl.current?.signal.aborted) { setNote('Stopped.'); return; }
    setErr(m);
  }

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); setNote('Copied to the clipboard.'); } catch { setNote('Copy was blocked by the browser; use View code and select the text.'); } };
  const download = async () => {
    const url = URL.createObjectURL(new Blob([shown || await inlinePhotos(html)], { type: 'text/html' }));
    const a = document.createElement('a'); a.href = url; a.download = `${(tpl?.id ?? 'brainyapp2-page')}-v${vi + 1}.html`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const steps: [Stage, string][] = [['write', 'Write the content'], ['render', 'Build the page'], ['done', 'Ready to review']];
  const order: Stage[] = ['idle', 'write', 'render', 'done'];
  const stepState = (s: Stage) => stage === s && s !== 'done' ? 'active' : order.indexOf(stage) >= order.indexOf(s) ? 'done' : '';

  return (
    <div className="studio">
      <section className="studio-form" aria-labelledby="studio-title">
        <div className="studio-head"><h1 id="studio-title">One-shot Studio</h1>{clear.button}</div>
        {clear.panel}
        <p style={{ margin: 0, color: 'var(--soft)', fontSize: 14 }}>Describe a website page: a landing page, a small business site, a portfolio or a shop front. The on-device AI writes the content and the Studio builds an accessible page from tested blocks, then previews it safely. For apps, dashboards and games, use “Get the Claude Code prompt”.</p>
        <label>Start from a template
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Blank: describe your own</option>
            {library.map((p) => <option key={p.id} value={p.id}>{p.category}: {p.title}{p.runsInStudio ? '' : ' (Claude Code prompt only)'}</option>)}
          </select>
        </label>
        <label>Your brief
          <textarea id="studio-brief" value={brief} onChange={(e) => setBrief(e.target.value)} maxLength={2400} placeholder="A calm, mobile-first page for a yoga studio in Lisbon: class schedule, teacher bios, prices and a contact form." />
        </label>
        {tpl && !tpl.runsInStudio && <p className="notice">This template is an app, not a page. Use “Get the Claude Code prompt” and build it with Claude Code.</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ready && (busy ? <button type="button" className="btn ghost" onClick={() => ctrl.current?.abort()}>Stop</button>
            : <button type="button" className="btn" onClick={generate} disabled={brief.trim().length < 10 || (tpl && !tpl.runsInStudio)}>Generate</button>)}
          <button type="button" className="btn ghost" onClick={() => { setCc(claudeCodePrompt(brief, cur?.spec)); setNote(''); }} disabled={busy || brief.trim().length < 10}>Get the Claude Code prompt</button>
          {clear.quick('Clear page', 'studio-brief')}
        </div>
        {!ready && <EngineGate />}
        <ol className="steps" aria-label="Progress">{steps.map(([s, l]) => <li key={s} data-s={stepState(s)}>{l}</li>)}</ol>
        <p role="status" aria-live="polite" style={{ margin: 0, fontSize: 14, color: 'var(--soft)' }}>{note}</p>
        {err && <p className="notice err" role="alert">{err}</p>}
        {html && ready && (
          <label>Refine this version
            <textarea style={{ minHeight: 80 }} value={change} onChange={(e) => setChange(e.target.value)} maxLength={600} placeholder="Use the ocean palette and add a pricing section with three plans." />
            <button type="button" className="btn ghost sm" onClick={refine} disabled={busy || !change.trim()} style={{ alignSelf: 'flex-start' }}>Apply change</button>
          </label>
        )}
        {cc && (
          <div className="prose">
            <h2 style={{ fontSize: 16, margin: '8px 0' }}>Claude Code prompt</h2>
            <pre>{cc}</pre>
            <button type="button" className="btn ghost sm" onClick={() => copy(cc)}>Copy prompt</button>
          </div>
        )}
      </section>
      <section className="preview-pane" aria-label="Preview">
        <div className="toolbar">
          <div className="seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}>Preview</button>
            <button type="button" aria-pressed={view === 'code'} onClick={() => setView('code')}>View code</button>
          </div>
          <div className="seg" role="group" aria-label="Width">
            {(Object.keys(WIDTHS) as (keyof typeof WIDTHS)[]).map((w) => <button key={w} type="button" aria-pressed={width === w} onClick={() => setWidth(w)}>{w}</button>)}
          </div>
          {versions.length > 1 && (
            <div className="seg" role="group" aria-label="Versions">
              {versions.map((_, i) => <button key={i} type="button" aria-pressed={vi === i} onClick={() => setVi(i)}>v{i + 1}</button>)}
            </div>
          )}
          <span style={{ flex: 1 }} />
          <button type="button" className="btn ghost sm" disabled={!html} onClick={async () => copy(shown || await inlinePhotos(html))}>Copy</button>
          <button type="button" className="btn ghost sm" disabled={!html} onClick={download}>Download .html</button>
          <button type="button" className="btn ghost sm" disabled={!html} onClick={() => { const el = wrap.current; if (!el?.requestFullscreen) { setNote('Full screen is not available here.'); return; } el.requestFullscreen().catch(() => setNote('Full screen is not available here.')); }}>Full screen</button>
        </div>
        {view === 'code' || (busy && stream)
          ? <pre className="codeview" aria-label={busy ? 'Content the AI is writing' : 'HTML source'}>{busy && stream ? stream : html || 'No page yet.'}</pre>
          : (
            <div className="frame-wrap" ref={wrap}>
              {shown
                ? <iframe key={frameKey} ref={frame} title="Generated page preview (sandboxed)" src="/sandbox.html" sandbox="allow-scripts allow-forms allow-modals" referrerPolicy="no-referrer" style={{ maxWidth: WIDTHS[width] }} />
                : html ? <div className="placeholder"><p>Adding the photos…</p></div>
                : <div className="placeholder"><p><b>Your page will appear here.</b></p><p>Pick a template or write a brief, then Generate. Pages run in a locked-down sandbox: they can't see your data or reach the internet.</p></div>}
            </div>
          )}
      </section>
    </div>
  );
}
