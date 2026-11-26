// Shared NLP UI: labels that say which library did the work, the one-click NLTK loader, and result views.
import { useState } from 'react';
import { onLinkClick } from '../lib/router';
import { runNltk, startNltk, useNltk, type Analysis, type AgreementMap, type Coach, type Sent } from './client';

/** Every NLP panel carries one of these, so it is always clear whether NLTK or spaCy produced a result. */
export function Lib({ lib, where }: { lib: 'NLTK' | 'spaCy'; where: 'live' | 'build' }) {
  return (
    <span className={`nlp-lib nlp-${lib.toLowerCase()}`}>
      <b>{lib}</b> {where === 'live' ? 'live in your browser (Pyodide)' : 'at deploy time (Python on Netlify)'}
    </span>
  );
}

export function Panel({ id, title, libs, children, intro }: { id: string; title: string; libs: React.ReactNode; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="nlp-panel" aria-labelledby={`${id}-h`} id={id}>
      <div className="nlp-panel-head"><h2 id={`${id}-h`}>{title}</h2><div className="nlp-libs">{libs}</div></div>
      {intro && <p className="nlp-intro">{intro}</p>}
      {children}
    </section>
  );
}

/** One click loads Python + NLTK in a worker. Nothing downloads before it. */
export function NltkGate({ children }: { children?: React.ReactNode }) {
  const s = useNltk();
  if (s.status === 'ready') return null;
  return (
    <div className="nlp-gate" role="status" aria-live="polite">
      {s.status === 'loading' ? <p><span className="nlp-spin" aria-hidden="true" /> Loading NLTK in your browser: {s.step}… (about 15 MB the first time, then cached)</p>
        : s.status === 'error' ? <p className="notice err">NLTK could not start: {s.error}. <button type="button" className="btn ghost sm" onClick={() => startNltk().catch(() => {})}>Try again</button></p>
        : <p>{children ?? 'NLTK runs on your device in Python (Pyodide). It downloads about 15 MB once, then it is cached.'}{' '}
          <button type="button" className="btn sm" onClick={() => startNltk().catch(() => {})}>Load NLTK</button></p>}
    </div>
  );
}

const pct = (x: number) => `${Math.round(Math.abs(x) * 100)}%`;
/** VADER compound score on a -1..+1 bar. */
export function Tone({ s, compact }: { s: Sent; compact?: boolean }) {
  const left = s.compound < 0 ? 50 + s.compound * 50 : 50;
  return (
    <span className={`nlp-tone ${s.label}${compact ? ' compact' : ''}`}>
      <span className="nlp-tone-bar" aria-hidden="true"><i style={{ left: `${left}%`, width: `${Math.abs(s.compound) * 50}%` }} /></span>
      <span>{s.label} <span className="nlp-num">({s.compound >= 0 ? '+' : ''}{s.compound.toFixed(2)})</span></span>
    </span>
  );
}

export function Bars({ rows, max, unit = '' }: { rows: [string, number][]; max?: number; unit?: string }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r[1]));
  return (
    <ul className="nlp-bars">
      {rows.map(([k, v]) => <li key={k}><span className="k">{k}</span><span className="bar" aria-hidden="true"><i style={{ width: `${(v / m) * 100}%` }} /></span><span className="v">{v}{unit}</span></li>)}
    </ul>
  );
}

export function AnalysisView({ a, ms }: { a: Analysis; ms?: number }) {
  return (
    <div className="nlp-result" aria-live="polite">
      <dl className="nlp-stats">
        {Object.entries(a.counts).map(([k, v]) => <div key={k}><dt>{k.replace(/_/g, ' ')}</dt><dd>{v.toLocaleString()}</dd></div>)}
      </dl>
      <p><b>Overall tone (VADER):</b> <Tone s={a.sentiment} /></p>
      <div className="nlp-cols">
        <div><h3>Top words (FreqDist, stopwords removed)</h3>{a.top_words.length ? <Bars rows={a.top_words} /> : <p className="small">No content words yet.</p>}</div>
        <div><h3>Collocations (likelihood ratio)</h3>
          {a.collocations.length ? <ul className="nlp-list">{a.collocations.map(([x, y, s, n]) => <li key={x + y}><b>{x} {y}</b> <span className="small">×{n}, score {s}</span></li>)}</ul>
            : <p className="small">No word pair repeats yet. Longer text finds more.</p>}
        </div>
      </div>
      {a.sentences.length > 0 && (<>
        <h3>Tone sentence by sentence</h3>
        <ol className="nlp-sents">{a.sentences.map((s, i) => <li key={i}><Tone s={s} compact /> <span>{s.text}</span></li>)}</ol>
      </>)}
      {ms !== undefined && <p className="small nlp-ms">Computed by NLTK on your device in {ms} ms.</p>}
    </div>
  );
}

export function CoachView({ c, ms, onUse }: { c: Coach; ms?: number; onUse?: (t: string) => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="nlp-result" aria-live="polite">
      <div className="nlp-score"><span className={`nlp-score-n ${c.score >= 80 ? 'good' : c.score >= 50 ? 'ok' : 'low'}`}>{c.score}</span>
        <span><b>Clarity score</b><br /><span className="small">5 checks, minus 5 per hedge word. Tone: <Tone s={c.sentiment} compact /></span></span></div>
      <ul className="nlp-checks">{c.checks.map((k) => <li key={k.id} data-ok={k.ok}><span aria-hidden="true">{k.ok ? '✓' : '!'}</span> <b>{k.label}</b>{!k.ok && k.tip && <> · {k.tip}</>}<span className="sr-only">{k.ok ? ' (passed)' : ' (missing)'}</span></li>)}</ul>
      {c.vague.length > 0 && <><h3>Vague words (NLTK tokens)</h3><ul className="nlp-list">{c.vague.map((v) => <li key={v.word}><mark>{v.word}</mark>{v.count > 1 && ` ×${v.count}`}: {v.tip}</li>)}</ul></>}
      {c.hedges.length > 0 && <p><b>Hedges:</b> {c.hedges.map((h) => <mark key={h}>{h}</mark>).reduce<React.ReactNode[]>((a, x, i) => (i ? [...a, ', ', x] : [x]), [])}. Cut them to sound sure of what you want.</p>}
      <div className="nlp-cols">
        <div><h3>Key topics <span className="small">(spaCy topic index)</span></h3>{c.topics.length ? <p>{c.topics.map((t) => <span key={t} className="nlp-chip">{t}</span>)}</p> : <p className="small">No known topic yet. Name the product, feature or field.</p>}</div>
        <div><h3>Best experts to ask</h3>{c.experts.length ? <ul className="nlp-list">{c.experts.map((e) => <li key={e.slug}><a href={`/expert/${e.slug}`} onClick={onLinkClick}>{e.name}</a> <span className="small">{e.title}</span></li>)}</ul> : <p className="small">Add a topic to get a match.</p>}</div>
      </div>
      {c.sharper && <>
        <h3>A sharper question</h3>
        <p className="nlp-sharper">{c.sharper}</p>
        <p className="small">Fill in the [brackets], then send it.</p>
        <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {onUse && <button type="button" className="btn sm" onClick={() => onUse(c.sharper)}>Use this question</button>}
          <button type="button" className="btn ghost sm" onClick={() => { navigator.clipboard?.writeText(c.sharper).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {}); }}>{copied ? 'Copied' : 'Copy'}</button>
        </p>
      </>}
      {ms !== undefined && <p className="small nlp-ms">NLTK on your device: {ms} ms.</p>}
    </div>
  );
}

const VERDICT: Record<string, string> = { agree: 'Agree', disagree: 'Disagree', 'different angles': 'Different angles' };
export function AgreementView({ m, ms }: { m: AgreementMap; ms?: number }) {
  return (
    <div className="nlp-result" aria-live="polite">
      <div className="nlp-cols">
        <div><h3>Where they agree</h3>{m.shared.length ? <ul className="nlp-list">{m.shared.map(([t, who]) => <li key={t}><b>{t}</b> <span className="small">{who.join(', ')}</span></li>)}</ul> : <p className="small">No shared idea found: each expert took a different angle.</p>}</div>
        <div><h3>Pair by pair</h3><ul className="nlp-list">{m.pairs.map((p) => <li key={p.a + p.b}><span className={`nlp-verdict ${p.verdict.replace(' ', '-')}`}>{VERDICT[p.verdict]}</span> {p.a} and {p.b} <span className="small">overlap {pct(p.overlap)}, tone gap {p.tone_gap.toFixed(2)}{p.conflict ? ', different recommendations' : ''}</span></li>)}</ul></div>
      </div>
      <h3>Each expert</h3>
      <ul className="nlp-experts">
        {m.experts.map((e) => (
          <li key={e.name}>
            <b>{e.name}</b> <Tone s={e.sentiment} compact />
            {e.recommends.length > 0 && <div className="small">Recommends: {e.recommends.join('; ')}</div>}
            <div>{e.terms.map((t) => <span key={t} className={`nlp-chip${e.unique.includes(t) ? ' only' : ''}`}>{t}</span>)}</div>
          </li>
        ))}
      </ul>
      <p className="small">Main ideas: NLTK word frequencies plus spaCy topic phrases. Outlined chips are ideas only that expert raised. Tone: NLTK VADER.{ms !== undefined && ` Computed on your device in ${ms} ms.`}</p>
    </div>
  );
}

/** "Coach" button under the chat box: NLTK checks the draft question before it is sent. */
export function CoachInline({ text, onUse }: { text: string; onUse: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const [out, setOut] = useState<{ c: Coach; ms: number }>();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setOpen(true); setErr(''); setBusy(true);
    try { const r = await runNltk<Coach>('coach', { text }); setOut({ c: r.result, ms: r.ms }); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="nlp-inline">
      <button type="button" className="btn ghost sm" disabled={!text.trim() || busy} onClick={run} title="NLTK checks your question for vague words before you send it">
        {busy ? 'Coaching…' : 'Coach my question (NLTK)'}</button>
      {open && (
        <div className="nlp-inline-box">
          <p className="nlp-libs"><Lib lib="NLTK" where="live" /> <Lib lib="spaCy" where="build" />
            <button type="button" className="btn ghost sm" onClick={() => setOpen(false)}>Close</button></p>
          {busy && !out && <NltkGate />}
          {err && <p className="notice err" role="alert">{err}</p>}
          {out && <CoachView c={out.c} ms={out.ms} onUse={(t) => { onUse(t); setOpen(false); }} />}
        </div>
      )}
    </div>
  );
}

/** "Show agreement map" under a whole-team answer. */
export function AgreementInline({ answers }: { answers: { name: string; text: string }[] }) {
  const [out, setOut] = useState<{ m: AgreementMap; ms: number }>();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (answers.length < 2) return null;
  const run = async () => {
    setErr(''); setBusy(true);
    try { const r = await runNltk<AgreementMap>('agreement', { answers }); setOut({ m: r.result, ms: r.ms }); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="nlp-inline">
      {!out && <button type="button" className="btn ghost sm" disabled={busy} onClick={run}>{busy ? 'Mapping…' : 'Show agreement map (NLTK + spaCy)'}</button>}
      {busy && !out && <NltkGate />}
      {err && <p className="notice err" role="alert">{err}</p>}
      {out && <div className="nlp-inline-box"><p className="nlp-libs"><Lib lib="NLTK" where="live" /> <Lib lib="spaCy" where="build" /></p><AgreementView m={out.m} ms={out.ms} /></div>}
    </div>
  );
}
