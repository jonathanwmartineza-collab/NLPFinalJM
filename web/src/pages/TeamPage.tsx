import { useEffect, useRef, useState } from 'react';
import type { Team } from '../lib/types';
import { streamModel } from '../lib/api';
import { loadChats, saveChat } from '../lib/storage';
import { useSpeech } from '../lib/voice';
import Markdown from '../components/Markdown';
import Composer from '../components/Composer';
import EngineGate, { DeviceBadge } from '../components/EngineGate';
import { Avatar } from '../components/Sidebar';
import { useEngine } from '../ai/engine';
import { Thinking, errorText, VoiceControls, ChatFooter } from '../components/ChatParts';
import { useClearOptions } from '../components/ClearOptions';

type Chip = { slug: string; state: 'queued' | 'thinking' | 'writing' | 'done' | 'failed' };
type Turn = { q: string; answer: string; contributions: { slug: string; text: string }[]; note?: string; failed?: number; stop?: string };

const EXAMPLES = [
  'I want to launch a booking app for independent yoga teachers. What should v1 include, how should it look, and what stack should we use?',
  'Review this idea: an AI tool that turns meeting notes into a project plan. Who is it for, what are the risks, and what would you build first?',
  'We need a landing page for a coffee subscription. Give me the positioning, the page structure, and the accessibility must-haves.',
];

export default function TeamPage({ team }: { team: Team }) {
  const [turns, setTurns] = useState<Turn[]>(() => (loadChats().__team as unknown as Turn[]) ?? []);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [since, setSince] = useState(0);
  const [chips, setChips] = useState<Chip[]>([]);
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');
  const [live, setLive] = useState('');
  const [seed, setSeed] = useState<{ text: string; n: number }>();
  const ctrl = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const speech = useSpeech();
  const director = team.agents.find((a) => a.slug === 'orchestrator')!;
  const by = (s: string) => team.agents.find((a) => a.slug === s);
  const engine = useEngine();
  const ready = engine.status === 'ready';
  const noAI = engine.status === 'unsupported';
  useEffect(() => { if (turns.length || busy) end.current?.scrollIntoView({ block: 'end' }); }, [turns, draft, chips, busy]);
  useEffect(() => () => ctrl.current?.abort(), []);
  const persist = (t: Turn[]) => saveChat('__team', t as any);
  const clear = useClearOptions({
    what: 'this team chat',
    canClear: turns.length > 0 && !busy,
    onClear: () => { const snap = turns; setTurns([]); persist([]); setErr(''); return () => { setTurns(snap); persist(snap); }; },
    onFreed: () => { ctrl.current?.abort(); setTurns([]); setErr(''); },
  });
  const toSetup = () => {
    const box = document.getElementById('ai-setup');
    box?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    box?.querySelector<HTMLElement>('input:checked, button')?.focus({ preventScroll: true });
  };

  async function ask(q: string) {
    setErr(''); setDraft(''); setChips([]); setBusy(true); setSince(Date.now()); setPhase(`${director.name} is choosing experts`); setLive(`${director.name} is choosing experts`);
    const c = (ctrl.current = new AbortController());
    const setChip = (slug: string, state: Chip['state']) => setChips((cs) => cs.map((x) => (x.slug === slug ? { ...x, state } : x)));
    try {
      const r = await streamModel({ mode: 'route', question: q }, () => {}, c.signal);
      if (!r.plan || !r.runToken) throw new Error('No routing plan came back.');
      const plan = r.plan; const token = r.runToken;
      setChips(plan.experts.map((e) => ({ slug: e.slug, state: 'queued' })));
      setPhase(`${plan.experts.length} experts are working`); setLive(`${plan.experts.length} experts are working`);
      // One local GPU: experts answer one after another.
      const results: ({ slug: string; text: string } | null)[] = [];
      for (const e of plan.experts) {
        if (c.signal.aborted) break;
        setChip(e.slug, 'thinking'); setPhase(`${by(e.slug)?.name ?? 'An expert'} is answering`);
        try {
          const x = await streamModel({ mode: 'expert', slug: e.slug, question: q, subQuestion: e.question, runToken: token }, () => setChip(e.slug, 'writing'), c.signal);
          if (!x.text) throw new Error('empty');
          setChip(e.slug, 'done'); results.push({ slug: e.slug, text: x.text });
        } catch { setChip(e.slug, 'failed'); results.push(null); }
      }
      const contribs = results.filter(Boolean) as { slug: string; text: string }[];
      if (c.signal.aborted) throw new DOMException('aborted', 'AbortError');
      if (!contribs.length) throw new Error('None of the experts could answer. Please try again.');
      const inputs = [...contribs];
      if (plan.stakes.length) {
        setChips((cs) => [...cs, { slug: 'red-team-reviewer', state: 'thinking' }]); setPhase('Yusra is stress-testing the answers');
        try {
          const rv = await streamModel({ mode: 'review', question: q, contributions: contribs.map((x) => ({ slug: x.slug, text: x.text.slice(0, 6000) })), runToken: token }, () => {}, c.signal);
          if (rv.text) { inputs.push({ slug: 'red-team-reviewer', text: rv.text }); setChip('red-team-reviewer', 'done'); } else setChip('red-team-reviewer', 'failed');
        } catch { setChip('red-team-reviewer', 'failed'); }
      }
      setPhase(`${director.name} is combining the answers`); setLive(`${director.name} is combining the answers`);
      let acc = '';
      const s = await streamModel({ mode: 'synth', question: q, contributions: inputs.map((x) => ({ slug: x.slug, text: x.text.slice(0, 6000) })), runToken: token }, (t) => { acc += t; setDraft(acc); }, c.signal);
      const failed = plan.experts.length - contribs.length;
      const turn: Turn = { q, answer: acc, contributions: inputs, failed, note: plan.fallback ? 'The routing plan could not be read, so a default panel answered.' : undefined, stop: s.complete ? undefined : s.stop === 'aborted' ? 'stopped' : 'cut' };
      const next = [...turns, turn]; setTurns(next); persist(next); setDraft(''); setChips([]);
      setLive('Reply complete'); if (acc && s.complete) speech.speak(acc);
    } catch (e) {
      if ((e as Error).name === 'AbortError') { setErr('Stopped.'); }
      else { setErr(errorText(e)); }
      setLive('');
    } finally { setBusy(false); setPhase(''); }
  }

  return (
    <div className={`chat${ready ? '' : ' gated'}`}>
      <header className="chat-head">
        <Avatar a={director} lg />
        <div style={{ flex: 1 }}>
          <h1>Ask the whole team <DeviceBadge /></h1>
          <p>{director.name} (the studio director) picks the right experts by topic, they answer one after another on your device, Yusra stress-tests big decisions, and {director.name} combines it all into one answer.</p>
          <VoiceControls speech={speech} />
        </div>
        <div className="head-actions">
          {clear.button}
        </div>
      </header>
      {clear.panel}
      <div className="messages" aria-label="Team conversation">
        {turns.length === 0 && !busy && (
          <div className="examples">
            <ol className="start" aria-label="Get started in 3 steps">
              <li data-done={ready}>
                <b>{noAI ? 'Use a device that can run the AI' : 'Turn on the free AI'}</b>
                <span>{ready ? 'Done. The AI is running on your device.'
                  : noAI ? <>This browser can't run it. Open this site in a recent Chrome or Edge on a laptop, or copy any expert's prompt into another AI chat. <button type="button" className="link-btn" onClick={toSetup}>Why?</button></>
                  : <>Download the recommended model once. <button type="button" className="link-btn" onClick={toSetup}>Go to the model picker</button></>}</span>
              </li>
              <li><b>Ask the team</b><span>Tap an example below or type your own question.</span></li>
              <li><b>Get one answer</b><span>{director.name} combines the experts' answers. Open “Who contributed” to see each one.</span></li>
            </ol>
            <p>Ask a question that spans several areas. {director.name} will bring in the right experts and give you one answer. For example:</p>
            {EXAMPLES.map((p) => <button key={p} type="button" className="chip-btn" onClick={() => setSeed({ text: p, n: Date.now() })}>{p}</button>)}
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="msg user">{t.q}</div>
            <div className="msg ai">
              <div className="msg-meta"><Avatar a={director} /> {director.name} for the team</div>
              <Markdown text={t.answer} />
              {t.note && <p className="notice">{t.note}</p>}
              {!!t.failed && <p className="notice warn">{t.contributions.filter((c) => c.slug !== 'red-team-reviewer').length} of {t.contributions.filter((c) => c.slug !== 'red-team-reviewer').length + t.failed} experts answered.</p>}
              {t.stop === 'cut' && <p className="notice warn">The combined answer was cut off. Ask a narrower follow-up, or ask one expert directly.</p>}
              <details className="contrib">
                <summary>Who contributed ({t.contributions.length})</summary>
                {t.contributions.map((c) => { const a = by(c.slug); return (
                  <div key={c.slug} className="one"><div className="msg-meta">{a && <Avatar a={a} />} <b style={{ color: 'var(--ink)' }}>{a?.name}</b> · {a?.title}</div><Markdown text={c.text} /></div>
                ); })}
              </details>
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Thinking since={since} label={phase} />
            {chips.length > 0 && (
              <div className="chips" aria-label="Experts working">
                {chips.map((c) => { const a = by(c.slug); return a ? <span key={c.slug} className="st" data-s={c.state}><Avatar a={a} /> {a.name} <span className="sr-only">{c.state}</span></span> : null; })}
              </div>
            )}
            {draft && <div className="msg ai"><div className="msg-meta"><Avatar a={director} /> {director.name}</div><Markdown text={draft} /></div>}
          </div>
        )}
        {err && <p className="notice err" role="alert">{err}</p>}
        <div ref={end} />
      </div>
      <div className="composer-wrap" id="ai-setup">
        {ready ? <Composer placeholder="Ask the whole team…" busy={busy} onSend={ask} onStop={() => ctrl.current?.abort()} seed={seed} />
          : <EngineGate />}
        <ChatFooter research={team.studio.researchDate} />
      </div>
      <div className="sr-only" role="status" aria-live="polite">{live}</div>
    </div>
  );
}
